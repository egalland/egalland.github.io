// Existing invitation links still open at their original location in the shared world.
export function worldURL(href) {
  const url=new URL(href);
  for(const key of [...url.searchParams.keys()]) {
    if(['salon','room'].includes(key.toLowerCase()))url.searchParams.delete(key);
  }
  return url;
}
