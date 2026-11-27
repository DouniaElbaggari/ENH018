export async function addConditionDescriptions(conditions: any[], configPayload: any, language: string = "EN"): Promise<void> {
  const lang = language.split("-")[0].toUpperCase();
  const configResults: any[] = configPayload?.results ?? [];

  const configByType = new Map<string, any>(
    configResults.map((cfg) => [cfg.ConditionType, cfg])
  );

  conditions.forEach((cond) => {
    const cfg = configByType.get(cond.ConditionType);
    const texts: any[] = cfg?.to_Text?.results ?? [];

    const match =
      texts.find((t) => t.Language === lang) ??
      texts.find((t) => t.Language === "EN") ??
      texts[0];

    cond.ConditionTypeName = match?.ConditionTypeName ?? null;
  });
}