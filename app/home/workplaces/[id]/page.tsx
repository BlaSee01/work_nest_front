// app/home/workplaces/[id]/page.tsx
import WorkplaceDetails from './WorkplaceDetails';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);   // stack mówi że już tylko promise, nigdsy params
  return <WorkplaceDetails id={id} />;
}
