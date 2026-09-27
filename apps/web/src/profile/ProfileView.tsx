import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@elliotJHarding/meals-api';
import {
  useFamilyGroup,
  useCreateFamilyGroup,
  useJoinFamilyGroup,
  useCalendarAuthorized,
  useCalendars,
  useUpdateActiveCalendars,
  useCalendarAuthUrl,
} from '@meals_client/core';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';

export default function ProfileView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page profile">
      <section className="profile-identity">
        <Avatar pictureUrl={user?.pictureUrl} name={user?.name} size={72} />
        <h1 className="display">{user?.name ?? 'You'}</h1>
      </section>

      <FamilyGroupSection />
      <CalendarSection />

      <button className="pill logout-pill" onClick={onLogout}>
        sign out
      </button>
    </div>
  );
}

type FgMode = 'idle' | 'invite' | 'join';

function FamilyGroupSection() {
  // The group lives in the familyGroup cache; useFamilyGroup maps "no group" to
  // null. Create/join both seed that cache, so the member list and uuid here
  // update without local group state.
  const { data: group } = useFamilyGroup();
  const createFamilyGroup = useCreateFamilyGroup();
  const joinFamilyGroup = useJoinFamilyGroup();
  const [mode, setMode] = useState<FgMode>('idle');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const linkFor = (uuid: string) => `${window.location.origin}/join/${uuid}`;

  const startInvite = async () => {
    setMode('invite');
    // A group only exists once invited; create one on first invite. The
    // create mutation returns the new group's uuid and seeds the cache.
    const uuid = group?.uuid ?? (await createFamilyGroup.mutateAsync());
    if (!uuid) return;
    setInviteLink(linkFor(uuid));
  };

  const onCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const cancel = () => {
    setMode('idle');
    setJoinCode('');
    setCopied(false);
  };

  const onJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoining(true);
    try {
      await joinFamilyGroup.mutateAsync(code);
      setJoinCode('');
      setMode('idle');
    } finally {
      setJoining(false);
    }
  };

  const members = group?.users ?? [];

  return (
    <section className="profile-section">
      <h2 className="smallcaps">family group</h2>

      <ul className="member-list">
        {members.map((member) => (
          <li key={member.name} className="member-row">
            <Avatar pictureUrl={member.pictureUrl} name={member.name} size={36} />
            <span>{member.name}</span>
          </li>
        ))}
        {members.length === 0 && (
          <li className="member-empty">Just you for now — invite someone to share the week.</li>
        )}
      </ul>

      {mode === 'idle' && (
        <div className="fg-actions">
          <button className="pill primary" onClick={startInvite}>
            invite someone
          </button>
          <button className="pill" onClick={() => setMode('join')}>
            have a code
          </button>
        </div>
      )}

      {mode === 'invite' && (
        <div className="fg-mode">
          <span className="invite-link-display">{inviteLink ?? 'preparing link…'}</span>
          <button className="pill primary" onClick={onCopy} disabled={!inviteLink}>
            {copied ? 'copied' : 'copy'}
          </button>
          <button className="fg-cancel" onClick={cancel} aria-label="cancel">
            ×
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="fg-mode">
          <div className="join-row">
            <input
              type="text"
              placeholder="paste an invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              autoFocus
            />
            <button className="pill" onClick={onJoin} disabled={joining || joinCode.trim() === ''}>
              {joining ? 'joining' : 'join'}
            </button>
          </div>
          <button className="fg-cancel" onClick={cancel} aria-label="cancel">
            ×
          </button>
        </div>
      )}
    </section>
  );
}

function CalendarSection() {
  // authorized stays tri-state: undefined while the query is in flight (render
  // nothing yet, matching the old `null`), then the resolved boolean. The
  // calendars query only runs once authorised.
  const { data: authorized } = useCalendarAuthorized();
  const { data: calendars = [] } = useCalendars(authorized === true);
  const updateActiveCalendars = useUpdateActiveCalendars();
  const calendarAuthUrl = useCalendarAuthUrl();
  const [connecting, setConnecting] = useState(false);

  const onConnect = async () => {
    setConnecting(true);
    // Full-page redirect to Google's consent screen; the server returns the
    // user to /calendar/link with a `code` we exchange there.
    window.location.href = await calendarAuthUrl.mutateAsync();
  };

  const onToggle = (calendar: Calendar) => {
    // Pass the full intended list (toggle applied); the mutation writes it
    // optimistically into the cache and reverts on failure.
    const updated = calendars.map((c) =>
      c.id === calendar.id ? { ...c, active: !c.active } : c,
    );
    updateActiveCalendars.mutate(updated);
  };

  return (
    <section className="profile-section">
      <div className="section-head">
        <h2 className="smallcaps">calendar</h2>
        {authorized !== undefined && (
          <span className={`status-dot ${authorized ? 'on' : 'off'}`}>
            {authorized ? 'connected' : 'not connected'}
          </span>
        )}
      </div>

      {authorized === false && (
        <>
          <p className="section-note">
            Link your Google Calendar so the week knows what you have on.
          </p>
          <button className="pill" onClick={onConnect} disabled={connecting}>
            {connecting ? 'connecting' : 'connect google calendar'}
          </button>
        </>
      )}

      {authorized && calendars.length === 0 && (
        <p className="section-note">No calendars found on your Google account.</p>
      )}

      {authorized && calendars.length > 0 && (
        <ul className="calendar-list">
          {calendars.map((calendar) => (
            <li
              key={calendar.id}
              className={`calendar-row ${calendar.active ? 'active' : ''}`}
              onClick={() => onToggle(calendar)}
            >
              <span className="swatch" style={{ background: calendar.colour }} />
              <span className="name">{calendar.name}</span>
              <span className={`toggle ${calendar.active ? 'on' : ''}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
