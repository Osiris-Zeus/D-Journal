#!/bin/bash
echo "Starting D-Journal..."
(cd backend && npm run dev) &
(cd frontend && npm run dev) &
wait
