// Article 73 — Reporting deadlines by incident type
export type IncidentType = "critical_infrastructure" | "death_involvement" | "other_serious";

const DEADLINE_DAYS: Record<IncidentType, number> = {
  critical_infrastructure: 2,
  death_involvement: 10,
  other_serious: 15,
};

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  critical_infrastructure: "Critical infrastructure disruption",
  death_involvement: "Death or serious health harm",
  other_serious: "Other serious incident",
};

export function calculateDeadline(incidentDate: Date, incidentType: IncidentType): Date {
  const days = DEADLINE_DAYS[incidentType];
  return new Date(incidentDate.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getDeadlineDays(incidentType: IncidentType): number {
  return DEADLINE_DAYS[incidentType];
}

export function getIncidentTypeLabel(incidentType: IncidentType): string {
  return INCIDENT_TYPE_LABELS[incidentType];
}

export function isValidIncidentType(value: string): value is IncidentType {
  return value in DEADLINE_DAYS;
}
