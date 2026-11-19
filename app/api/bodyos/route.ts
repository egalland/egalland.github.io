import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  activityLogs,
  appSettings,
  dailyLogs,
  foods,
  harvestEntries,
  measurements,
  produceCatalog,
  producePrices,
  profiles,
  programDays,
  programExercises,
  strengthSessions,
  strengthSets,
  supplements,
  taskDefinitions,
  taskStates,
  trainingPrograms,
  workouts,
} from "../../../db/schema";
import { coerceMuscles, findExerciseDefinition } from "../../exercise-catalog";

const now = () => new Date().toISOString();

function numberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function chunked<T>(items: readonly T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

type ProducePriceVersion = typeof producePrices.$inferSelect;
type PriceTimeline = Map<number, ProducePriceVersion[]>;

function buildPriceTimeline(prices: ProducePriceVersion[]) {
  const timeline: PriceTimeline = new Map();
  for (const price of prices) {
    const versions = timeline.get(price.produceId) ?? [];
    versions.push(price);
    timeline.set(price.produceId, versions);
  }
  for (const versions of timeline.values()) {
    versions.sort(
      (left, right) =>
        left.effectiveAt.localeCompare(right.effectiveAt) || left.id - right.id,
    );
  }
  return timeline;
}

function priceVersionAtDate(
  timeline: PriceTimeline,
  produceId: number,
  harvestDate: string,
) {
  const versions = timeline.get(produceId) ?? [];
  if (!versions.length) return null;
  const applicable = versions.filter(
    (version) => version.effectiveAt <= harvestDate,
  );
  if (applicable.length) return applicable.at(-1) ?? null;

  const earliestDate = versions[0].effectiveAt;
  return (
    versions.filter((version) => version.effectiveAt === earliestDate).at(-1) ??
    null
  );
}

function pricesMatch(left: number | null, right: number | null) {
  if (left === null || right === null) return left === right;
  return Math.abs(left - right) < 0.000001;
}

function normalizedHarvestPriceMode(
  harvest: Pick<
    typeof harvestEntries.$inferSelect,
    "priceMode" | "pricePerKg" | "produceId"
  >,
  timeline: PriceTimeline,
): "catalog" | "manual" {
  if (harvest.priceMode === "catalog" || harvest.priceMode === "manual")
    return harvest.priceMode;
  if (harvest.pricePerKg === null) return "catalog";
  const versions =
    harvest.produceId === null ? [] : (timeline.get(harvest.produceId) ?? []);
  return versions.some((version) =>
    pricesMatch(version.pricePerKg, harvest.pricePerKg),
  )
    ? "catalog"
    : "manual";
}

function encodedMuscles(value: unknown) {
  return JSON.stringify(coerceMuscles(value));
}

const BODY_TARGET_KEYS = [
  "chestCm",
  "waistCm",
  "hipsCm",
  "bicepsCm",
  "forearmCm",
  "thighCm",
  "calfCm",
  "neckCm",
  "shouldersCm",
] as const;

function encodedBodyTargets(value: unknown) {
  let source: Record<string, unknown> = {};
  if (typeof value === "string" && value.trim()) {
    try {
      source = JSON.parse(value) as Record<string, unknown>;
    } catch {
      source = {};
    }
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    source = value as Record<string, unknown>;
  }
  return JSON.stringify(
    Object.fromEntries(
      BODY_TARGET_KEYS.flatMap((key) => {
        const parsed = numberOrNull(source[key]);
        return parsed !== null && parsed > 0 ? [[key, parsed]] : [];
      }),
    ),
  );
}

function routeError(error: unknown) {
  console.error("BodyOS API failure", error);
  const message = error instanceof Error ? error.message : "Erreur inattendue";
  if (message.includes("no such table"))
    return "La base BodyOS n’est pas encore à jour.";
  return message;
}

export async function GET() {
  try {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, 1))
      .limit(1);
    const [settings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, 1))
      .limit(1);
    const [
      logs,
      bodyMeasurements,
      legacyWorkouts,
      foodCatalog,
      supplementList,
      activities,
      programs,
      days,
      exercises,
      sessions,
      sets,
      tasks,
      states,
      produce,
      prices,
      harvests,
    ] = await Promise.all([
      db.select().from(dailyLogs).orderBy(desc(dailyLogs.logDate)).limit(180),
      db
        .select()
        .from(measurements)
        .orderBy(desc(measurements.measuredAt), desc(measurements.id))
        .limit(60),
      db
        .select()
        .from(workouts)
        .orderBy(desc(workouts.workoutDate), desc(workouts.id))
        .limit(120),
      db.select().from(foods).orderBy(desc(foods.favorite), foods.name),
      db
        .select()
        .from(supplements)
        .orderBy(desc(supplements.active), supplements.name),
      db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.activityDate), desc(activityLogs.id))
        .limit(180),
      db
        .select()
        .from(trainingPrograms)
        .orderBy(
          desc(trainingPrograms.active),
          desc(trainingPrograms.updatedAt),
        ),
      db
        .select()
        .from(programDays)
        .orderBy(
          asc(programDays.programId),
          asc(programDays.orderIndex),
          asc(programDays.id),
        ),
      db
        .select()
        .from(programExercises)
        .orderBy(
          asc(programExercises.dayId),
          asc(programExercises.orderIndex),
          asc(programExercises.id),
        ),
      db
        .select()
        .from(strengthSessions)
        .orderBy(desc(strengthSessions.startedAt))
        .limit(120),
      db
        .select()
        .from(strengthSets)
        .orderBy(desc(strengthSets.completedAt))
        .limit(1200),
      db
        .select()
        .from(taskDefinitions)
        .orderBy(asc(taskDefinitions.orderIndex), asc(taskDefinitions.id)),
      db
        .select()
        .from(taskStates)
        .orderBy(desc(taskStates.taskDate), desc(taskStates.id))
        .limit(1200),
      db
        .select()
        .from(produceCatalog)
        .orderBy(
          desc(produceCatalog.active),
          asc(produceCatalog.name),
          asc(produceCatalog.variety),
        ),
      db
        .select()
        .from(producePrices)
        .orderBy(desc(producePrices.effectiveAt), desc(producePrices.id))
        .limit(500),
      db
        .select()
        .from(harvestEntries)
        .orderBy(desc(harvestEntries.harvestDate), desc(harvestEntries.id))
        .limit(1500),
    ]);

    const responseNow = now();
    const priceTimeline = buildPriceTimeline(prices);
    const produceById = new Map(produce.map((item) => [item.id, item]));
    const resolvedProduce = produce.map((item) => {
      const currentPrice = priceVersionAtDate(
        priceTimeline,
        item.id,
        responseNow.slice(0, 10),
      );
      return {
        ...item,
        defaultPricePerKg:
          currentPrice?.pricePerKg ?? item.defaultPricePerKg,
        priceSource: currentPrice?.source ?? item.priceSource,
      };
    });
    const resolvedHarvests = harvests.map((harvest) => {
      const priceMode = normalizedHarvestPriceMode(harvest, priceTimeline);
      if (priceMode === "manual") return { ...harvest, priceMode };
      const automaticPrice =
        harvest.produceId === null
          ? null
          : (priceVersionAtDate(
              priceTimeline,
              harvest.produceId,
              harvest.harvestDate,
            )?.pricePerKg ??
            produceById.get(harvest.produceId)?.defaultPricePerKg ??
            null);
      return {
        ...harvest,
        priceMode,
        pricePerKg: automaticPrice,
        valueCents:
          automaticPrice === null
            ? null
            : Math.round(harvest.weightKg * automaticPrice * 100),
      };
    });

    return Response.json({
      serverNow: responseNow,
      profile,
      settings,
      logs,
      measurements: bodyMeasurements,
      workouts: legacyWorkouts,
      foods: foodCatalog,
      supplements: supplementList,
      activities,
      programs,
      programDays: days,
      programExercises: exercises.map((exercise) => {
        const definition = findExerciseDefinition(
          exercise.catalogKey || exercise.name,
        );
        const primaryMuscles = coerceMuscles(exercise.primaryMuscles);
        const secondaryMuscles = coerceMuscles(exercise.secondaryMuscles);
        return {
          ...exercise,
          catalogKey: exercise.catalogKey ?? definition?.key ?? null,
          primaryMuscles:
            primaryMuscles.length > 0
              ? primaryMuscles
              : (definition?.primaryMuscles ?? []),
          secondaryMuscles:
            secondaryMuscles.length > 0
              ? secondaryMuscles
              : (definition?.secondaryMuscles ?? []),
        };
      }),
      strengthSessions: sessions,
      strengthSets: sets,
      tasks,
      taskStates: states,
      produce: resolvedProduce,
      producePrices: prices,
      harvests: resolvedHarvests,
    });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const action = String(payload.action ?? "");
    const db = getDb();

    if (action === "save-log") {
      const logDate = textOrEmpty(payload.logDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate))
        return Response.json({ error: "Date invalide" }, { status: 400 });
      const values = {
        logDate,
        weightKg: numberOrNull(payload.weightKg),
        bodyFatPct: numberOrNull(payload.bodyFatPct),
        waistCm: numberOrNull(payload.waistCm),
        calories: numberOrNull(payload.calories),
        proteinG: numberOrNull(payload.proteinG),
        carbsG: numberOrNull(payload.carbsG),
        fatG: numberOrNull(payload.fatG),
        steps: numberOrNull(payload.steps),
        waterMl: numberOrNull(payload.waterMl),
        sleepHours: numberOrNull(payload.sleepHours),
        energy: numberOrNull(payload.energy),
        trainingMinutes: numberOrNull(payload.trainingMinutes),
        notes: textOrEmpty(payload.notes),
        updatedAt: now(),
      };
      const [log] = await db
        .insert(dailyLogs)
        .values(values)
        .onConflictDoUpdate({ target: dailyLogs.logDate, set: values })
        .returning();
      return Response.json({ log });
    }

    if (action === "add-measurement") {
      const measuredAt = textOrEmpty(payload.measuredAt);
      if (!measuredAt)
        return Response.json({ error: "Date requise" }, { status: 400 });
      const [measurement] = await db
        .insert(measurements)
        .values({
          measuredAt,
          weightKg: numberOrNull(payload.weightKg),
          bodyFatPct: numberOrNull(payload.bodyFatPct),
          chestCm: numberOrNull(payload.chestCm),
          waistCm: numberOrNull(payload.waistCm),
          abdomenCm: numberOrNull(payload.abdomenCm),
          hipsCm: numberOrNull(payload.hipsCm),
          bicepsLeftCm: numberOrNull(payload.bicepsLeftCm),
          bicepsRightCm: numberOrNull(payload.bicepsRightCm),
          thighLeftCm: numberOrNull(payload.thighLeftCm),
          thighRightCm: numberOrNull(payload.thighRightCm),
          calvesCm: numberOrNull(payload.calvesCm),
          neckCm: numberOrNull(payload.neckCm),
          shouldersCm: numberOrNull(payload.shouldersCm),
          forearmLeftCm: numberOrNull(payload.forearmLeftCm),
          forearmRightCm: numberOrNull(payload.forearmRightCm),
          calfLeftCm: numberOrNull(payload.calfLeftCm),
          calfRightCm: numberOrNull(payload.calfRightCm),
          note: textOrEmpty(payload.note),
        })
        .returning();
      return Response.json({ measurement }, { status: 201 });
    }

    if (action === "add-food") {
      const name = textOrEmpty(payload.name);
      if (!name) return Response.json({ error: "Nom requis" }, { status: 400 });
      const [food] = await db
        .insert(foods)
        .values({
          name,
          category: textOrEmpty(payload.category) || "Autre",
          pricePerKg: numberOrNull(payload.pricePerKg),
          kcalPer100g: numberOrNull(payload.kcalPer100g),
          proteinPer100g: numberOrNull(payload.proteinPer100g),
          carbsPer100g: numberOrNull(payload.carbsPer100g),
          fatPer100g: numberOrNull(payload.fatPer100g),
          source: textOrEmpty(payload.source),
          favorite: Boolean(payload.favorite),
          updatedAt: now(),
        })
        .returning();
      return Response.json({ food }, { status: 201 });
    }

    if (action === "add-supplement") {
      const name = textOrEmpty(payload.name);
      if (!name) return Response.json({ error: "Nom requis" }, { status: 400 });
      const [supplement] = await db
        .insert(supplements)
        .values({
          name,
          dose: textOrEmpty(payload.dose) || "À paramétrer",
          timing: textOrEmpty(payload.timing) || "À paramétrer",
          costCents: numberOrNull(payload.costCents),
          servingsPerPack: numberOrNull(payload.servingsPerPack),
          stockServings: numberOrNull(payload.stockServings),
          active: payload.active === undefined ? true : Boolean(payload.active),
          note: textOrEmpty(payload.note),
        })
        .returning();
      return Response.json({ supplement }, { status: 201 });
    }

    if (action === "update-supplement") {
      const [supplement] = await db
        .update(supplements)
        .set({
          dose: textOrEmpty(payload.dose) || "À paramétrer",
          timing: textOrEmpty(payload.timing) || "À paramétrer",
          costCents: numberOrNull(payload.costCents),
          servingsPerPack: numberOrNull(payload.servingsPerPack),
          stockServings: numberOrNull(payload.stockServings),
          active: Boolean(payload.active),
          note: textOrEmpty(payload.note),
          updatedAt: now(),
        })
        .where(eq(supplements.id, Number(payload.id)))
        .returning();
      return Response.json({ supplement });
    }

    if (action === "delete-supplement") {
      await db
        .delete(supplements)
        .where(eq(supplements.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "add-activity") {
      const activityDate = textOrEmpty(payload.activityDate);
      const activityType = textOrEmpty(payload.activityType);
      const category = textOrEmpty(payload.category);
      const durationMinutes = numberOrNull(payload.durationMinutes);
      if (
        !activityDate ||
        !activityType ||
        !category ||
        durationMinutes === null
      )
        return Response.json(
          { error: "Date, activité et durée requises" },
          { status: 400 },
        );
      const [activity] = await db
        .insert(activityLogs)
        .values({
          activityDate,
          activityType,
          category,
          durationMinutes,
          distanceKm: numberOrNull(payload.distanceKm),
          steps: numberOrNull(payload.steps),
          calories: numberOrNull(payload.calories),
          intensity: numberOrNull(payload.intensity),
          note: textOrEmpty(payload.note),
        })
        .returning();
      return Response.json({ activity }, { status: 201 });
    }

    if (action === "delete-activity") {
      await db
        .delete(activityLogs)
        .where(eq(activityLogs.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "save-profile") {
      const [current] = await db.select().from(profiles).where(eq(profiles.id, 1));
      const [profile] = await db
        .update(profiles)
        .set({
          heightCm: numberOrNull(payload.heightCm) ?? current.heightCm,
          baselineWeightKg: numberOrNull(payload.baselineWeightKg) ?? current.baselineWeightKg,
          baselineBodyFatPct: numberOrNull(payload.baselineBodyFatPct),
          targetPhaseOneKg: numberOrNull(payload.targetPhaseOneKg) ?? current.targetPhaseOneKg,
          targetWeightKg: numberOrNull(payload.targetWeightKg) ?? current.targetWeightKg,
          targetBodyFatPct: numberOrNull(payload.targetBodyFatPct) ?? current.targetBodyFatPct,
          dailyCalories: numberOrNull(payload.dailyCalories) ?? current.dailyCalories,
          dailyProteinG: numberOrNull(payload.dailyProteinG),
          dailySteps: numberOrNull(payload.dailySteps) ?? current.dailySteps,
          weeklyWorkouts: numberOrNull(payload.weeklyWorkouts) ?? current.weeklyWorkouts,
          personalGoalDate: textOrEmpty(payload.personalGoalDate) || null,
          weeklyLossRateKg: numberOrNull(payload.weeklyLossRateKg) ?? current.weeklyLossRateKg,
          updatedAt: now(),
        })
        .where(eq(profiles.id, 1))
        .returning();
      return Response.json({ profile });
    }

    if (action === "save-morphology") {
      const requestedModel = textOrEmpty(payload.proportionModel);
      const proportionModel = ["classic", "adaptive", "custom"].includes(
        requestedModel,
      )
        ? requestedModel
        : "classic";
      const tolerance = numberOrNull(payload.proportionTolerancePct) ?? 4;
      const [profile] = await db
        .update(profiles)
        .set({
          wristCm: numberOrNull(payload.wristCm),
          ankleCm: numberOrNull(payload.ankleCm),
          proportionModel,
          proportionTolerancePct: Math.max(1, Math.min(12, tolerance)),
          customBodyTargets: encodedBodyTargets(payload.customBodyTargets),
          updatedAt: now(),
        })
        .where(eq(profiles.id, 1))
        .returning();
      return Response.json({ profile });
    }

    if (action === "save-settings") {
      const [settings] = await db
        .update(appSettings)
        .set({
          weeklyBudgetCents: numberOrNull(payload.weeklyBudgetCents) ?? 0,
          email: textOrEmpty(payload.email),
          weeklyEmail: Boolean(payload.weeklyEmail),
          emailDay: textOrEmpty(payload.emailDay) || "dimanche",
          emailTime: textOrEmpty(payload.emailTime) || "18:00",
          compactMode: Boolean(payload.compactMode),
          accent: textOrEmpty(payload.accent) || "acid",
          updatedAt: now(),
        })
        .where(eq(appSettings.id, 1))
        .returning();
      return Response.json({ settings });
    }

    if (action === "add-task") {
      const title = textOrEmpty(payload.title);
      if (!title)
        return Response.json({ error: "Nom de tâche requis" }, { status: 400 });
      const requestedRecurrence = textOrEmpty(payload.recurrence);
      const recurrence = ["daily", "weekdays", "weekends"].includes(
        requestedRecurrence,
      )
        ? requestedRecurrence
        : "daily";
      const requestedAutoSource = textOrEmpty(payload.autoSource);
      const autoSource = ["weight", "steps", "workout", "harvest"].includes(
        requestedAutoSource,
      )
        ? requestedAutoSource
        : null;
      const existingTasks = await db.select().from(taskDefinitions);
      const [task] = await db
        .insert(taskDefinitions)
        .values({
          title,
          domain: textOrEmpty(payload.domain) || "Personnel",
          recurrence,
          defaultTime: textOrEmpty(payload.defaultTime) || null,
          autoSource,
          orderIndex: existingTasks.length,
        })
        .returning();
      return Response.json({ task }, { status: 201 });
    }

    if (action === "delete-task") {
      await db
        .delete(taskDefinitions)
        .where(eq(taskDefinitions.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "set-task-status") {
      const taskId = Number(payload.taskId);
      const taskDate = textOrEmpty(payload.taskDate);
      const status = textOrEmpty(payload.status);
      if (!Number.isFinite(taskId) || !/^\d{4}-\d{2}-\d{2}$/.test(taskDate))
        return Response.json(
          { error: "Tâche ou date invalide" },
          { status: 400 },
        );
      if (status === "pending") {
        await db
          .delete(taskStates)
          .where(
            and(
              eq(taskStates.taskId, taskId),
              eq(taskStates.taskDate, taskDate),
            ),
          );
        return Response.json({ ok: true });
      }
      if (!["done", "skipped", "postponed"].includes(status))
        return Response.json({ error: "Statut invalide" }, { status: 400 });
      const values = {
        taskId,
        taskDate,
        status,
        completedAt: status === "done" ? now() : null,
        note: textOrEmpty(payload.note),
      };
      const [state] = await db
        .insert(taskStates)
        .values(values)
        .onConflictDoUpdate({
          target: [taskStates.taskId, taskStates.taskDate],
          set: values,
        })
        .returning();
      return Response.json({ state });
    }

    if (action === "add-produce") {
      const name = textOrEmpty(payload.name);
      if (!name)
        return Response.json(
          { error: "Nom du légume requis" },
          { status: 400 },
        );
      const price = numberOrNull(payload.defaultPricePerKg);
      const source = textOrEmpty(payload.priceSource);
      const effectiveAt =
        textOrEmpty(payload.effectiveAt) || now().slice(0, 10);
      if (price !== null && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveAt))
        return Response.json(
          { error: "Date d’effet invalide" },
          { status: 400 },
        );
      const [produce] = await db
        .insert(produceCatalog)
        .values({
          name,
          variety: textOrEmpty(payload.variety),
          category: textOrEmpty(payload.category) || "Potager",
          defaultPricePerKg: price,
          priceSource: source,
        })
        .returning();
      if (price !== null && price >= 0) {
        await db.insert(producePrices).values({
          produceId: produce.id,
          effectiveAt,
          pricePerKg: price,
          source,
        });
      }
      return Response.json({ produce }, { status: 201 });
    }

    if (action === "update-produce-price") {
      const id = Number(payload.id);
      const price = numberOrNull(payload.pricePerKg);
      if (!Number.isFinite(id) || price === null || price < 0)
        return Response.json({ error: "Prix invalide" }, { status: 400 });
      const source = textOrEmpty(payload.source);
      const effectiveAt =
        textOrEmpty(payload.effectiveAt) || now().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveAt))
        return Response.json(
          { error: "Date d’effet invalide" },
          { status: 400 },
        );
      const [produce] = await db
        .update(produceCatalog)
        .set({
          defaultPricePerKg: price,
          priceSource: source,
          updatedAt: now(),
        })
        .where(eq(produceCatalog.id, id))
        .returning();
      if (!produce)
        return Response.json({ error: "Légume introuvable" }, { status: 404 });
      await db.insert(producePrices).values({
        produceId: id,
        effectiveAt,
        pricePerKg: price,
        source,
      });
      return Response.json({ produce });
    }

    if (action === "add-harvest-batch") {
      const harvestDate = textOrEmpty(payload.harvestDate);
      const requestedEntries = Array.isArray(payload.entries)
        ? payload.entries
        : [];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(harvestDate) || !requestedEntries.length)
        return Response.json(
          { error: "Date et récolte requises" },
          { status: 400 },
        );
      const [catalog, prices] = await Promise.all([
        db.select().from(produceCatalog),
        db.select().from(producePrices),
      ]);
      const byId = new Map(catalog.map((produce) => [produce.id, produce]));
      const priceTimeline = buildPriceTimeline(prices);
      const rows = requestedEntries.slice(0, 30).flatMap((rawEntry) => {
        if (!rawEntry || typeof rawEntry !== "object") return [];
        const entry = rawEntry as Record<string, unknown>;
        const produce = byId.get(Number(entry.produceId));
        const weightKg = numberOrNull(entry.weightKg);
        if (!produce || weightKg === null || weightKg <= 0) return [];
        const requestedPrice = numberOrNull(entry.pricePerKg);
        const automaticPrice =
          priceVersionAtDate(priceTimeline, produce.id, harvestDate)
            ?.pricePerKg ?? produce.defaultPricePerKg;
        const requestedMode = textOrEmpty(entry.priceMode);
        const priceMode: "catalog" | "manual" =
          requestedMode === "manual" ||
          (requestedMode !== "catalog" &&
            requestedPrice !== null &&
            !pricesMatch(requestedPrice, automaticPrice))
            ? "manual"
            : "catalog";
        const pricePerKg =
          priceMode === "manual" ? requestedPrice : automaticPrice;
        const units = numberOrNull(entry.unitCount);
        return [
          {
            harvestDate,
            produceId: produce.id,
            produceName: produce.name,
            variety: produce.variety,
            weightKg,
            unitCount: units === null ? null : Math.max(0, Math.round(units)),
            destination: textOrEmpty(entry.destination) || "À consommer",
            priceMode,
            pricePerKg,
            valueCents:
              pricePerKg === null
                ? null
                : Math.round(weightKg * pricePerKg * 100),
            note: textOrEmpty(entry.note),
          },
        ];
      });
      if (!rows.length)
        return Response.json(
          { error: "Aucune ligne de récolte valide" },
          { status: 400 },
        );
      const harvests: Array<typeof harvestEntries.$inferSelect> = [];
      for (const harvestBatch of chunked(rows, 6)) {
        const inserted = await db
          .insert(harvestEntries)
          .values(harvestBatch)
          .returning();
        harvests.push(...inserted);
      }
      return Response.json({ harvests }, { status: 201 });
    }

    if (action === "update-harvest") {
      const id = Number(payload.id);
      const harvestDate = textOrEmpty(payload.harvestDate);
      const produceId = Number(payload.produceId);
      const weightKg = numberOrNull(payload.weightKg);
      const unitCount = numberOrNull(payload.unitCount);
      const requestedPrice = numberOrNull(payload.pricePerKg);

      if (!Number.isInteger(id) || id <= 0)
        return Response.json(
          { error: "Récolte invalide" },
          { status: 400 },
        );
      if (!/^\d{4}-\d{2}-\d{2}$/.test(harvestDate))
        return Response.json({ error: "Date invalide" }, { status: 400 });
      if (weightKg === null || weightKg <= 0)
        return Response.json({ error: "Poids invalide" }, { status: 400 });
      if (unitCount !== null && unitCount < 0)
        return Response.json(
          { error: "Nombre d’unités invalide" },
          { status: 400 },
        );
      if (requestedPrice !== null && requestedPrice < 0)
        return Response.json({ error: "Prix invalide" }, { status: 400 });

      const [produce] = await db
        .select()
        .from(produceCatalog)
        .where(eq(produceCatalog.id, produceId))
        .limit(1);
      if (!produce)
        return Response.json({ error: "Légume introuvable" }, { status: 404 });

      const prices = await db
        .select()
        .from(producePrices)
        .where(eq(producePrices.produceId, produce.id));
      const automaticPrice =
        priceVersionAtDate(
          buildPriceTimeline(prices),
          produce.id,
          harvestDate,
        )?.pricePerKg ?? produce.defaultPricePerKg;
      const requestedMode = textOrEmpty(payload.priceMode);
      const priceMode: "catalog" | "manual" =
        requestedMode === "manual" ||
        (requestedMode !== "catalog" &&
          requestedPrice !== null &&
          !pricesMatch(requestedPrice, automaticPrice))
          ? "manual"
          : "catalog";
      const pricePerKg =
        priceMode === "manual" ? requestedPrice : automaticPrice;

      const [harvest] = await db
        .update(harvestEntries)
        .set({
          harvestDate,
          produceId: produce.id,
          produceName: produce.name,
          variety: produce.variety,
          weightKg,
          unitCount:
            unitCount === null ? null : Math.max(0, Math.round(unitCount)),
          destination: textOrEmpty(payload.destination) || "À consommer",
          priceMode,
          pricePerKg,
          valueCents:
            pricePerKg === null
              ? null
              : Math.round(weightKg * pricePerKg * 100),
          note: textOrEmpty(payload.note),
        })
        .where(eq(harvestEntries.id, id))
        .returning();
      if (!harvest)
        return Response.json({ error: "Récolte introuvable" }, { status: 404 });

      return Response.json({ harvest });
    }

    if (action === "delete-harvest") {
      await db
        .delete(harvestEntries)
        .where(eq(harvestEntries.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "add-program") {
      await db
        .update(trainingPrograms)
        .set({ active: false, updatedAt: now() });
      const [program] = await db
        .insert(trainingPrograms)
        .values({
          name: textOrEmpty(payload.name) || "Programme",
          description: textOrEmpty(payload.description),
          active: true,
        })
        .returning();
      return Response.json({ program }, { status: 201 });
    }

    if (action === "set-active-program") {
      await db
        .update(trainingPrograms)
        .set({ active: false, updatedAt: now() });
      const [program] = await db
        .update(trainingPrograms)
        .set({ active: true, updatedAt: now() })
        .where(eq(trainingPrograms.id, Number(payload.id)))
        .returning();
      return Response.json({ program });
    }

    if (action === "add-program-day") {
      const programId = Number(payload.programId);
      const existingDays = await db
        .select()
        .from(programDays)
        .where(eq(programDays.programId, programId));
      const [day] = await db
        .insert(programDays)
        .values({
          programId,
          name:
            textOrEmpty(payload.name) || `SÉANCE ${existingDays.length + 1}`,
          orderIndex: existingDays.length,
          cardioMinutes: numberOrNull(payload.cardioMinutes),
          note: textOrEmpty(payload.note),
        })
        .returning();
      return Response.json({ day }, { status: 201 });
    }

    if (action === "delete-program-day") {
      await db
        .delete(programDays)
        .where(eq(programDays.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "add-program-exercise") {
      const dayId = Number(payload.dayId);
      const definition = findExerciseDefinition(
        textOrEmpty(payload.catalogKey) || textOrEmpty(payload.name),
      );
      const existingExercises = await db
        .select()
        .from(programExercises)
        .where(eq(programExercises.dayId, dayId));
      const [exercise] = await db
        .insert(programExercises)
        .values({
          dayId,
          name:
            textOrEmpty(payload.name) || definition?.name || "Nouvel exercice",
          catalogKey:
            textOrEmpty(payload.catalogKey) || definition?.key || null,
          muscleGroup:
            textOrEmpty(payload.muscleGroup) || definition?.category || "Autre",
          primaryMuscles: encodedMuscles(
            coerceMuscles(payload.primaryMuscles).length
              ? payload.primaryMuscles
              : definition?.primaryMuscles,
          ),
          secondaryMuscles: encodedMuscles(
            coerceMuscles(payload.secondaryMuscles).length
              ? payload.secondaryMuscles
              : definition?.secondaryMuscles,
          ),
          equipment:
            textOrEmpty(payload.equipment) || definition?.equipment || "",
          orderIndex: existingExercises.length,
          targetSets: numberOrNull(payload.targetSets) ?? 3,
          targetRepsMin: numberOrNull(payload.targetRepsMin) ?? 8,
          targetRepsMax: numberOrNull(payload.targetRepsMax) ?? 12,
          restSeconds: numberOrNull(payload.restSeconds) ?? 90,
          defaultWeightKg: numberOrNull(payload.defaultWeightKg),
          note: textOrEmpty(payload.note),
        })
        .returning();
      return Response.json({ exercise }, { status: 201 });
    }

    if (action === "update-program-exercise") {
      const definition = findExerciseDefinition(
        textOrEmpty(payload.catalogKey) || textOrEmpty(payload.name),
      );
      const [exercise] = await db
        .update(programExercises)
        .set({
          name: textOrEmpty(payload.name) || definition?.name || "Exercice",
          catalogKey:
            textOrEmpty(payload.catalogKey) || definition?.key || null,
          muscleGroup:
            textOrEmpty(payload.muscleGroup) || definition?.category || "Autre",
          primaryMuscles: encodedMuscles(payload.primaryMuscles),
          secondaryMuscles: encodedMuscles(payload.secondaryMuscles),
          equipment:
            textOrEmpty(payload.equipment) || definition?.equipment || "",
          targetSets: numberOrNull(payload.targetSets) ?? 3,
          targetRepsMin: numberOrNull(payload.targetRepsMin) ?? 8,
          targetRepsMax: numberOrNull(payload.targetRepsMax) ?? 12,
          restSeconds: numberOrNull(payload.restSeconds) ?? 90,
          defaultWeightKg: numberOrNull(payload.defaultWeightKg),
          note: textOrEmpty(payload.note),
        })
        .where(eq(programExercises.id, Number(payload.id)))
        .returning();
      return Response.json({ exercise });
    }

    if (action === "delete-program-exercise") {
      await db
        .delete(programExercises)
        .where(eq(programExercises.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "start-strength-session") {
      const current = await db
        .select()
        .from(strengthSessions)
        .where(isNull(strengthSessions.completedAt))
        .limit(1);
      if (current[0]) return Response.json({ session: current[0] });
      const [session] = await db
        .insert(strengthSessions)
        .values({
          programDayId: numberOrNull(payload.programDayId),
          sessionName: textOrEmpty(payload.sessionName) || "Séance libre",
          startedAt: now(),
        })
        .returning();
      return Response.json({ session }, { status: 201 });
    }

    if (action === "save-strength-set") {
      const sessionId = Number(payload.sessionId);
      const exerciseName = textOrEmpty(payload.exerciseName);
      const setIndex = Number(payload.setIndex);
      const values = {
        sessionId,
        exerciseId: numberOrNull(payload.exerciseId),
        exerciseName,
        setIndex,
        reps: numberOrNull(payload.reps) ?? 0,
        weightKg: numberOrNull(payload.weightKg) ?? 0,
        rir: numberOrNull(payload.rir),
        restSeconds: numberOrNull(payload.restSeconds),
        completedAt: now(),
      };
      const [set] = await db
        .insert(strengthSets)
        .values(values)
        .onConflictDoUpdate({
          target: [
            strengthSets.sessionId,
            strengthSets.exerciseName,
            strengthSets.setIndex,
          ],
          set: values,
        })
        .returning();
      return Response.json({ set });
    }

    if (action === "finish-strength-session") {
      const sessionId = Number(payload.sessionId);
      const sessionSets = await db
        .select()
        .from(strengthSets)
        .where(eq(strengthSets.sessionId, sessionId));
      const totalVolumeKg = sessionSets.reduce(
        (sum, set) => sum + set.reps * set.weightKg,
        0,
      );
      const [session] = await db
        .update(strengthSessions)
        .set({
          completedAt: now(),
          durationSeconds: numberOrNull(payload.durationSeconds),
          totalVolumeKg,
          totalSets: sessionSets.length,
          note: textOrEmpty(payload.note),
        })
        .where(eq(strengthSessions.id, sessionId))
        .returning();
      return Response.json({ session });
    }

    if (action === "delete-strength-session") {
      await db
        .delete(strengthSessions)
        .where(eq(strengthSessions.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "delete-workout") {
      await db.delete(workouts).where(eq(workouts.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    if (action === "delete-food") {
      await db.delete(foods).where(eq(foods.id, Number(payload.id)));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
