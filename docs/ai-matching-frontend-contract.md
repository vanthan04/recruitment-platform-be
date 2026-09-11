# Find Matching CVs — Frontend Contract

## Endpoint
`POST /api/v1/jobs/:jobId/matching-candidates`

Auth: Bearer JWT (recruiter role, `job:match:candidates` permission — already granted to RECRUITER). No request body needed.

## Response (200)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Matching candidates retrieved successfully",
  "data": {
    "jobId": "uuid",
    "matches": [
      {
        "candidateId": "uuid",
        "score": 92,
        "matchedSkills": ["NestJS", "PostgreSQL"],
        "missingSkills": ["Kubernetes"],
        "reason": "Strong backend experience with NestJS and PostgreSQL."
      }
    ]
  }
}
```

## Empty state
`matches: []` — either no candidates matched the job's skills at all, or none had a completed CV analysis yet. Show: "No matching candidates yet — candidates are analyzed shortly after uploading a CV; try again later, or broaden the job's required skills."

## Loading state
This call can take several seconds (LLM tool-call loop). Show a loading indicator; do not add a client-side timeout shorter than ~35s (`AI_REQUEST_TIMEOUT_MS` default).

## Error states
| HTTP | code | Meaning | Suggested UI |
|---|---|---|---|
| 401 | — | Not authenticated | Redirect to login |
| 403 | `HTTP_ERROR` | Not a recruiter / missing permission | Hide the "Find Matching CVs" button entirely for non-recruiters |
| 403 | `JOB_MATCH_ACCESS_DENIED` | Job belongs to another recruiter | Should be unreachable from the UI (button only shown on own jobs) |
| 404 | `JOB_NOT_FOUND` | Job id invalid/deleted | "This job no longer exists" |
| 503 | `AI_PROVIDER_ERROR` / `AI_PROVIDER_TIMEOUT` / `AI_INVALID_OUTPUT` | AI provider failed/timed out/returned bad data | "Matching is temporarily unavailable — try again in a moment" + retry button |

## UI flow
```
Job Detail page → [Find Matching CVs] button (recruiter-owner only)
   → Loading state
   → Candidate cards/table: score (badge), matchedSkills (chips), missingSkills (chips), reason (text)
   → [View Candidate] — link target TBD: no dedicated public candidate-profile
     endpoint exists yet; until one is built, this can link to the existing
     recruiter-side candidate view used from an application (if the
     candidate has applied) or be omitted for candidates who haven't.
```

Do not implement a candidate-approval workflow from this screen — matching is read-only recommendation, all hiring actions go through the existing application-status endpoints.
