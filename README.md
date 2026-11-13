# C-Sawe Library

My portfolio: a 3D study where every book on the shelf is one of my GitHub repositories.

- `index.html` is the whole site. It loads Three.js from cdnjs and the images in `img/`.
- `worker/groq-proxy.js` is an optional Cloudflare Worker that lets the desk robot answer questions with a Groq model. The API key lives in the Worker as a secret, never in this repository.
- `is-a-dev-c-sawe.json` is the record to submit to [is-a-dev/register](https://github.com/is-a-dev/register) as `domains/c-sawe.json` for the address `c-sawe.is-a.dev`. After it is merged, add a file named `CNAME` here containing `c-sawe.is-a.dev`.
