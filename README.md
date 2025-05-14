# Ghost Rebrand Tool

A tool to update your company name (or any string, I suppose?) in all your Ghost posts.
Updates are applied to titles and post content. After your rename request is submitted,
you'll be redirected to a progress page where you can watch the progress of your job.
This page will be available for 24 hours after job creation.

To setup locally, just clone and run:<br>
```npm i```

To run:<br>
```npm run dev:with-worker```

You will also need a local redis instance running. I suggest using Docker:<br>
```docker run --name redis-local -p 6379:6379 -d redis```

The tool will be running at http://localhost:3000/

Run the tests with:<br>
```npm test```
