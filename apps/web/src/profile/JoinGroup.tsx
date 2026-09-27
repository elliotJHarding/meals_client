import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJoinFamilyGroup } from '@meals_client/core';

// Target of the invite link (/join/:uuid). Joins the group, then returns to
// the profile where the new member list shows. The ref stops dev's
// double-invoke from joining twice.
export default function JoinGroup() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const joined = useRef(false);
  const joinFamilyGroup = useJoinFamilyGroup();

  useEffect(() => {
    if (joined.current) return;
    joined.current = true;

    if (!uuid) {
      setError(true);
      return;
    }

    // useJoinFamilyGroup writes the joined group into the familyGroup cache, so
    // the profile shows the new member list when we navigate back.
    joinFamilyGroup
      .mutateAsync(uuid)
      .then(() => navigate('/profile', { replace: true }))
      .catch(() => setError(true));
  }, [uuid, navigate]);

  return (
    <div className="loading-page">
      {error ? 'could not join that group' : 'joining the group…'}
    </div>
  );
}
