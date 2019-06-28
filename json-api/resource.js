export default function addResourceToWindow(resource) {
  let string = `${resource}Resource`
  window[string] = new JsonApiResource(resource)
}

class JsonApiResource {
}
