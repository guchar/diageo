#!/bin/bash

# Start the Next.js web application
npm run dev &

# Start the job scanner service
npm run scanner &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 