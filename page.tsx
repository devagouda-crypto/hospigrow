'use client';

import { useAppointments } from '@hospigrow/api-client';
import { Badge, Card, CardContent, EmptyState } from '@hospigrow/ui';
import { CalendarHeart } from 'lucide-react';

export default function PatientAppointmentsPage() {
  const { data, isLoading } = useAppointments({});
  const appointments = data?.entry.map((e) => e.resource) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">My visits</h1>
        <p className="mt-1 text-sm text-ink-500">
          Past and upcoming appointments.
        </p>
      </header>

      {isLoading ? (
        <p className="text-ink-500">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="h-8 w-8" />}
          title="No appointments yet"
          description="Once you book or are seen, your visits will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => {
            const dt = new Date(a.start);
            return (
              <li key={a.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-lg text-ink-900">
                          {dt.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          ·{' '}
                          {dt.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="mt-1 text-sm text-ink-600">
                          {a.description ?? 'Appointment'}
                        </div>
                      </div>
                      <Badge>{a.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
