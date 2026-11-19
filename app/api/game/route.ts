// The retired voxel endpoint cannot initialize a world, expose a sector or accept orders.
export async function POST() {
  return Response.json({error:'Le monde est désormais une simulation de colonies IA.'},
    {status:410, headers:{'Cache-Control':'private, no-store'}});
}
