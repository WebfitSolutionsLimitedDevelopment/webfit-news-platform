import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AdminHeader, AdminShell } from '@/components/admin/AdminShell';
import { assignmentSession, findAssignment } from '@/lib/volunteer-assignment-server';
import { assignmentLabels, assignmentStatuses, type Assignment, type AssignmentFile } from '@/lib/volunteer-assignments';
import { AssignmentActions, NewAssignment } from './AssignmentForms';

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ id?: string; status?: string }> }) {
  const session = await assignmentSession();
  if (!session) notFound();
  const { id, status } = await searchParams;
  const filter = z.enum(assignmentStatuses).safeParse(status).data;
  let list = session.admin.from('volunteer_assignments').select('id,title,venue,volunteer_name,event_date,status');
  if (!session.reviewer) list = list.eq('volunteer_id', session.user.id).neq('status', 'draft');
  if (filter) list = list.eq('status', filter);

  const [{ data: assignments, error }, { data: volunteers }, selected] = await Promise.all([
    list.order('created_at', { ascending: false }).limit(150),
    session.reviewer
      ? session.admin.from('profiles').select('id,display_name,email').eq('role', 'volunteer').eq('is_active', true).order('display_name')
      : Promise.resolve({ data: [] }),
    id && z.string().uuid().safeParse(id).success ? findAssignment(session, id) : null,
  ]);
  if (error) throw error;
  if (id && !selected) notFound();
  let files: AssignmentFile[] = [];
  if (selected) {
    let query = session.admin.from('volunteer_assignment_files').select('id,kind,filename,content_type').eq('assignment_id', selected.id);
    if (selected.status === 'complete') query = query.eq('kind', 'briefing');
    const result = await query.order('created_at');
    if (result.error) throw result.error;
    files = result.data as AssignmentFile[];
  }

  const heading = session.reviewer ? 'Volunteer assignments' : 'My assignments';
  return <AdminShell active={heading}>
    <AdminHeader title={heading} description={session.reviewer
      ? 'Brief volunteers, track responses and review their event reports.'
      : 'Review your assignments, download your authorisation and report back after the event.'} />
    {selected && <AssignmentActions key={selected.id} assignment={selected} files={files} reviewer={session.reviewer} />}
    {session.reviewer && !selected && <NewAssignment volunteers={volunteers || []} />}
    <section className="admin-card">
      <div className="admin-card-head"><h2>Assignments</h2></div>
      <nav className="admin-actions" aria-label="Assignment status filters">
        <Link className={filter ? 'admin-secondary' : 'admin-primary'} href="/admin/assignments">All</Link>
        {assignmentStatuses.filter(value => session.reviewer || value !== 'draft').map(value =>
          <Link key={value} className={filter === value ? 'admin-primary' : 'admin-secondary'} href={`/admin/assignments?status=${value}`}>
            {assignmentLabels[value]}
          </Link>
        )}
      </nav>
      <div className="admin-table-wrap">
        <table><thead><tr><th>Assignment</th>{session.reviewer && <th>Volunteer</th>}<th>Event date</th><th>Status</th></tr></thead>
          <tbody>
            {assignments.map(row => <tr key={row.id}>
              <td><Link className="admin-text-link" href={`/admin/assignments?id=${row.id}`}>{row.title}</Link><br /><small>{row.venue}</small></td>
              {session.reviewer && <td>{row.volunteer_name}</td>}
              <td>{row.event_date}</td>
              <td>{assignmentLabels[row.status as Assignment['status']]}</td>
            </tr>)}
            {!assignments.length && <tr><td colSpan={session.reviewer ? 4 : 3}>No assignments here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </AdminShell>;
}
