#!/usr/bin/env python3
"""Créer les dépôts dédiés à partir des éditions publiques vérifiées."""

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

OWNER = "egalland"
ORIGIN = "https://github.com/egalland/egalland.github.io.git"


def call(*args, cwd=None, check=True, data=None):
    result = subprocess.run(args, cwd=cwd, input=data, capture_output=True, text=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or args[0])
    return result


def github_json(*args):
    return json.loads(call("gh", *args).stdout)


def load_projects():
    path = Path(__file__).resolve().parent.parent / "editions.json"
    projects = json.loads(path.read_text(encoding="utf-8"))
    for item in projects:
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", item["depot"]):
            raise ValueError("Nom de dépôt invalide")
        if not all(re.fullmatch(r"[0-9a-f]{40}", item[key]) for key in ("commit", "arbre")):
            raise ValueError("Empreinte Git invalide")
    return projects


def prepare_source(item, project):
    call("git", "init", "--quiet", "--initial-branch=main", str(project))
    call("git", "fetch", "--quiet", "--depth=1", ORIGIN, item["commit"], cwd=project)
    suffix = ":" + item["dossier"] if item["dossier"] else "^{tree}"
    tree = call("git", "rev-parse", "FETCH_HEAD" + suffix, cwd=project).stdout.strip()
    if tree != item["arbre"]:
        raise ValueError("L’arbre Git reçu diffère de l’édition vérifiée")
    commit = call("git", "-c", "user.name=Emmanuel Galland", "-c",
                  "user.email=31864638+egalland@users.noreply.github.com",
                  "commit-tree", tree, "-m", "Importer l’édition publique de " + item["titre"],
                  "-m", "Source vérifiée : " + ORIGIN[:-4] + "/commit/" + item["commit"], cwd=project).stdout.strip()
    call("git", "update-ref", "refs/heads/main", commit, cwd=project)


def target_state(name):
    result = call("gh", "api", "repos/" + OWNER + "/" + name, check=False)
    if result.returncode:
        if "HTTP 404" in result.stderr or "HTTP 404" in result.stdout:
            return None
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


def publish(item, project):
    name = item["depot"]
    target = OWNER + "/" + name
    current = target_state(name)
    if current:
        if current["visibility"] != "public":
            return "déjà existant avec accès restreint, ignoré"
        branches = github_json("api", "repos/" + target + "/branches?per_page=1")
        if branches:
            return "déjà existant et peuplé, ignoré"
    prepare_source(item, project)
    if not current:
        call("gh", "repo", "create", target, "--public", "--description", item["titre"])
    call("git", "-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential",
         "push", "https://github.com/" + target + ".git",
         "refs/heads/main:refs/heads/main", cwd=project)
    saved = github_json("api", "repos/" + target + "/git/ref/heads/main")
    commit = github_json("api", "repos/" + target + "/git/commits/" + saved["object"]["sha"])
    if target_state(name)["visibility"] != "public" or commit["tree"]["sha"] != item["arbre"]:
        raise ValueError("La vérification distante a échoué")
    return "publié et vérifié"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publier", action="store_true", help="créer les dépôts publics manquants")
    parser.add_argument("depots", nargs="*", help="noms à traiter (par défaut toutes les éditions listées)")
    args = parser.parse_args()
    items = load_projects()
    if args.depots:
        chosen = set(args.depots)
        known = {x["depot"] for x in items}
        if chosen - known:
            parser.error("Dépôt absent de la sélection : " + ", ".join(sorted(chosen - known)))
        items = [x for x in items if x["depot"] in chosen]
    if not args.publier:
        for item in items:
            print(f'{OWNER}/{item["depot"]}  {item["commit"][:10]}  {item["titre"]}')
        return 0
    if github_json("api", "user")["login"] != OWNER:
        raise RuntimeError("Connecter GitHub CLI au compte " + OWNER)
    errors = 0
    for item in items:
        try:
            with tempfile.TemporaryDirectory() as tmp:
                status = publish(item, Path(tmp) / "depot")
        except (ValueError, RuntimeError, OSError) as problem:
            errors += 1
            status = str(problem)
        print(f'{OWNER}/{item["depot"]} : {status}', flush=True)
    return int(errors > 0)


if __name__ == "__main__":
    raise SystemExit(main())
