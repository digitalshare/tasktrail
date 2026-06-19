import scaffold from "../assets/demo-images/scaffold.jpg";
import roofing from "../assets/demo-images/roofing.jpg";
import ladder from "../assets/demo-images/ladder.jpg";
import electrical from "../assets/demo-images/electrical.jpg";
import excavation from "../assets/demo-images/excavation.jpg";

export interface DemoImage {
  id: string;
  label: string;
  area: string;
  src: string;
}

/** Pre-loaded "camera views" the worker can point the AI at (no live camera needed). */
export const DEMO_IMAGES: DemoImage[] = [
  { id: "scaffold", label: "Scaffold — west wall", area: "Exterior", src: scaffold },
  { id: "roofing", label: "Roof flashing", area: "Roof", src: roofing },
  { id: "ladder", label: "Ladder access — rear", area: "Exterior", src: ladder },
  { id: "electrical", label: "Power & wiring", area: "Electrical", src: electrical },
  { id: "excavation", label: "Excavation — street", area: "Groundworks", src: excavation },
];

export function getImage(id: string): DemoImage {
  return DEMO_IMAGES.find((i) => i.id === id) ?? DEMO_IMAGES[0];
}

/** Fetch a bundled image and convert it to a base64 data URL for the vision model. */
export async function imageToDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
