# Real-time architecture decision

Decision record for the e-classroom, the whiteboard, and live presence. Written
in Batch A2, before any real-time code exists, so that batches A7 through A9
have something settled to build against.

Status: decided. LiveKit Cloud (EU Frankfurt) is acceptable under Rwanda DPP.

## 1. What was asked

The build prompt proposed a starting table and asked for it to be confirmed or
revised with our own research, covering cost at 5,000 and at 50,000 students,
self-hosting effort, licensing terms, and mobile SDK support.

## 2. Decisions

| Need | Decision | Changed from the proposal? |
| --- | --- | --- |
| Video and audio | LiveKit, on **LiveKit Cloud**, not self-hosted | Yes, reversed |
| Whiteboard | Excalidraw, embedded as a React component | No |
| Live sync layer | Yjs with a self-hosted Hocuspocus server on Render | No |
| Presence and cursors | Hocuspocus awareness, the same connection | Yes, collapsed |
| Node graph library | ReactFlow rejected | No |
| Managed collaboration vendor | Liveblocks rejected | No |

## 3. The two findings that changed the plan

### Render cannot host a WebRTC SFU

This is the decisive constraint and it is not a cost question. `render.yaml`
puts the API on Render in Frankfurt. Render web services accept HTTP and
WebSocket traffic through a load balancer and **do not pass UDP**, and a
service is reachable only by domain name, never by IP. A WebRTC SFU needs a
publicly reachable IP and a wide inbound UDP range, typically 50000 to 60000,
for RTP media. Self-hosting LiveKit therefore cannot happen on the platform we
run on. It would mean a separate VPS with a public IP, its own TURN server,
its own firewall rules, and its own operations story.

There is a second problem with self-hosting even if we accepted a VPS. Render
has no African region, which is why the API sits in Frankfurt next to the
database. That trade is right for the API, where one page makes several
database calls and one trip to the user. It is wrong for live video, where
every media packet makes the trip. LiveKit Cloud runs a global edge mesh and
terminates media closer to Kigali than Frankfurt can. Self-hosting would make
the latency worse, not better, while costing more.

The proposal's reasoning was that self-hosting keeps costs on infrastructure we
already own. That reasoning does not survive contact with the platform: we do
not own anything that can carry the media.

### Liveblocks is no longer billed per monthly active user

The proposal asked us to get current monthly active user pricing and estimate
it at 5,000 to 50,000 students. That premise is out of date. Liveblocks now
lists monthly active users as **unlimited** on every plan and meters
collaboration minutes instead, at $0.002 per minute, counted per participant,
and only when two or more participants share a room.

A classroom is close to the worst possible shape for that meter. A single
sixty student class running for one hour is 3,600 collaboration minutes, about
$7.20 for one session. Headcount never enters the calculation, which means the
number does not improve by having fewer students enrolled, only by having
fewer of them in a room together, which is the entire feature.

## 4. Cost model

Assumption used throughout: 20 percent of students attend live sessions, 10
hours each per month. State the assumption because the answer is sensitive to
it. Figures are platform wide, per month, in US dollars.

| | 5,000 students | 50,000 students |
| --- | --- | --- |
| Live minutes per month | 600,000 | 6,000,000 |
| **Liveblocks** at $0.002 per collaboration minute | about $1,200 | about $12,000 |
| **LiveKit Cloud** video and audio | about $275, Ship plan plus overage | about $2,300, Scale plan plus overage |
| **Hocuspocus** self-hosted sync and presence | one Render service, flat | one Render service, flat |

LiveKit Cloud publishes $0.0005 per WebRTC participant minute on the $50 Ship
plan, which includes 150,000 minutes, and $0.0004 on the $500 Scale plan, which
includes 1.5 million. Hocuspocus is a fixed price because it is our own service
on a plan we choose, and it reuses the `stackedu-cache` key value store already
provisioned in Frankfurt in `render.yaml` for multi instance coordination.

Self-hosted LiveKit is not in the table because section 3 rules it out on the
current platform. For the record, published estimates put a self-operated SFU
stack at roughly $800 to $2,500 a month in compute at 50,000 to 100,000 call
minutes, before any engineering time, which is worse than LiveKit Cloud at both
of our volumes.

Liveblocks is rejected on cost by a factor of four at both scales, and it is
rejected on top of that for presence alone, because section 5 shows we get
presence for nothing.

One caveat on the Liveblocks rate: a secondary source quotes $0.04 per
collaboration minute rather than the $0.002 on the vendor's own pricing page.
The conclusion does not depend on which is right. At the higher figure
Liveblocks is twenty times worse.

## 5. Licensing and mobile

**Excalidraw is MIT** and free to embed commercially at any scale, published as
`@excalidraw/excalidraw` for React 19, which is the React version we are on.
The alternative worth naming is tldraw, which since SDK 4.0 runs in development
mode only without a license key and costs $6,000 a year for a commercial
production licence. For a product sold to institutions that is a recurring cost
attached to one screen, so Excalidraw is the clear choice.

One caveat that becomes real work in Batch A8: **the Excalidraw npm package does
not ship collaboration.** The hosted excalidraw.com app has it, the embeddable
component does not. We supply the sync ourselves, which is exactly what Yjs is
for, so this costs nothing extra in dependencies but it is not free in effort.

**Hocuspocus is MIT**, currently version 4, and runs on Node 22, which matches
the API runtime. It scales across instances through Redis and persists through
`onLoadDocument` and `onStoreDocument` hooks, so whiteboard state can be stored
by us rather than by a vendor. It is transport compatible with Render because
it is a WebSocket server, not a UDP one.

**Presence needs no separate system.** Hocuspocus already syncs awareness state,
meaning cursors, selections, and who is online, over the same connection that
carries the document. The proposal listed presence as a fourth row where
Liveblocks might still earn its keep on a narrow slice. It does not, because
the slice is already covered by a service we are running anyway. Building a
second WebSocket channel for presence would also violate the DRY rule.

**Mobile carries over.** `@livekit/react-native` is Apache 2.0, actively
released, and wraps the same `livekit-client` the web app will use, so the
Phase 18 mobile app reuses the web integration rather than reimplementing it.
Nothing about the Cloud decision blocks that, because the client SDK is
identical whether the server is Cloud or self-hosted.

## 6. Rwanda DPP decision for LiveKit Cloud

LiveKit Cloud is an external processor for live video and audio. The business
accepted that routing, with the project in the European Union (Frankfurt)
region. Recordings do not stay with LiveKit: LiveKit Egress writes the file
to our object storage through `storage.ts`, and the database stores only the
object key.

## 7. What this means for later batches

- **A7**, video and audio, integrates the LiveKit client SDK against a
  `LIVEKIT_URL` environment variable. Because the LiveKit server is Apache 2.0
  and self-hostable, pointing that variable at our own server later is a
  configuration change, not a rewrite. Keep it that way: no LiveKit Cloud
  specific API may leak into the codebase.
- **A8**, whiteboard, is Excalidraw plus a Yjs binding, talking to a Hocuspocus
  service added to `render.yaml` in the Frankfurt region alongside the API, and
  reusing `stackedu-cache`.
- **A9**, recording, uses LiveKit Egress writing to R2 over the S3 API, which
  is the bucket and the code path `apps/api/src/lib/storage.ts` already has.
  The recording is an object, its key is a row, exactly as the data and storage
  standards require.

LiveKit Cloud credentials and `HOCUSPOCUS_URL` are env vars. Tests inject a
media-room adapter and never call Cloud.

## 8. Sources

LiveKit Cloud plan and per minute rates, and the Apache 2.0 self-hosting
option, from LiveKit pricing coverage current to 2026, plus a VPS deployment
guide documenting the required UDP port range. Render's HTTP only ingress and
domain only addressing from Render's web services documentation and from
mediasoup deployment threads reporting blank media on Render. Liveblocks plans,
unlimited monthly active users, and the collaboration minute meter from
liveblocks.io pricing and billing documentation. Excalidraw licence and React
package from the project repository and documentation, and the absence of
collaboration in the npm package from the maintainers' own discussion thread.
tldraw licence terms from tldraw.dev. Hocuspocus licence, runtime support, and
Redis scaling from its repository, npm package, and version 4 release notes.
`@livekit/react-native` from its npm package listing.
