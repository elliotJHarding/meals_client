import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FamilyGroupDto } from '@elliotJHarding/meals-api';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import * as familyGroupApi from '../api/family-group';
import * as calendarApi from '../api/calendar';

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
  const [group, setGroup] = useState<FamilyGroupDto | null>(null);
  const [mode, setMode] = useState<FgMode>('idle');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    familyGroupApi.getFamilyGroup().then(setGroup).catch(() => setGroup(null));
  }, []);

  const linkFor = (uuid: string) => `${window.location.origin}/join/${uuid}`;

  const startInvite = async () => {
    setMode('invite');
    // A group only exists once invited; create one on first invite. The
    // create endpoint returns the new group's uuid directly.
    const uuid = group?.uuid ?? (await familyGroupApi.createFamilyGroup());
    if (!uuid) return;
    setGroup((current) => ({ uuid, users: current?.users ?? [] }));
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
      const joined = await familyGroupApi.joinFamilyGroup(code);
      setGroup(joined);
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
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    calendarApi
      .isCalendarAuthorized()
      .then((isAuthorized) => {
        setAuthorized(isAuthorized);
        if (isAuthorized) {
          calendarApi.getCalendars().then(setCalendars).catch(() => setCalendars([]));
        }
      })
      .catch(() => setAuthorized(false));
  }, []);

  const onConnect = async () => {
    setConnecting(true);
    // Full-page redirect to Google's consent screen; the server returns the
    // user to /calendar/link with a `code` we exchange there.
    window.location.href = await calendarApi.getCalendarAuthUrl();
  };

  const onToggle = (calendar: Calendar) => {
    const updated = calendars.map((c) =>
      c.id === calendar.id ? { ...c, active: !c.active } : c,
    );
    setCalendars(updated);
    calendarApi.updateActiveCalendars(updated).catch(() => {
      // Revert on failure so the UI stays truthful.
      setCalendars(calendars);
    });
  };

  return (
    <section className="profile-section">
      <div className="section-head">
        <h2 className="smallcaps">calendar</h2>
        {authorized !== null && (
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
