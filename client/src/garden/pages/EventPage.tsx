// Garden design — EventPage reuses the production EventPage
import EventPage from '../../pages/EventPage';

export default function GardenEventPage({ slug }: { slug: string }) {
  return <EventPage slug={slug} />;
}
