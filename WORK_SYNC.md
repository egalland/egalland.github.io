# Work sync contract

When a Work takes ownership of a project, retain its permanent PROJECT_ID. Update .portfolio/project.json with schemaVersion, id, name, slug, status, progress, links, metrics, lastWorkedAt, and changelog. Do not invent measured time or prompt counts. Keep imported, tracked, and estimated values distinct.

Project Lab generates a prompt containing this contract and the current project description. A future repository sync can import the manifest after validating it.
