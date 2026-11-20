# seatview

See the view from your seat before you buy the ticket.

seatview renders an approximate first-person view from any seat of a venue
(open-air theaters, concert halls, cinemas) and, later, shows window/view
information for train and bus seats.

> Status: early planning. Views are estimates and will be calibrated with
> on-site photos.

## Stack

- Web: Next.js + React Three Fiber (Three.js) + TypeScript
- API (phase 2): Spring Boot + PostgreSQL
- Venues are described as JSON files; a generator per venue type
  (amphitheater, cinema, train coach) creates the 3D seat positions.

## Repository structure

```
web/      Next.js app (run all npm commands here)
  src/viewer/   3D scene code (React Three Fiber)
  src/engine/   pure seat-position math (planned)
venues/   one JSON file per venue
```

## Development

```
cd web
npm install
npm run dev
```

## Roadmap

1. Harbiye Açıkhava demo: seat generator, 3D scene, seat-eye camera
2. On-site calibration with real photos
3. Backend: user reports, admin approval (train window status)
4. More venues, SEO pages, partnerships

## License

All rights reserved for now. A license will be chosen before the repository
becomes public.
