import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

export default function ParallaxDemo() {
  return (
    <>
      <ParallaxComponent />
      <div className="osmo-credits bg-white p-4 text-center">
        <p className="osmo-credits__p text-gray-500">Resource by <a target="_blank" href="https://www.osmo.supply/" className="osmo-credits__p-a text-blue-500 hover:underline">Osmo</a>
        </p>
      </div>
    </>
  );
}
