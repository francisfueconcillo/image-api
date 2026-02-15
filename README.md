# image-api
An Image API that uploads images to a Vercel Blob and resized by another service 
[image-resizer](https://github.com/francisfueconcillo/image-resizer), to be used for web and Flutter mobile apps


## Local Setup
- `pnpm i`
- `pnpm start`

## Deployments
- Deploy using Vercel or [render.com](https://render.com/)
- Storage is Vercel Blob
- GCP Pub/Sub is used for messaging between the API and the image resizer service


## API Documentation
- View Swagger UI at http://localhost:3000/docs

