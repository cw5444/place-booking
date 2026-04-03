import Link from "next/link";
import { notFound } from "next/navigation";
import PlaceImages from "./PlaceImages";

type PlaceId = "worship" | "small1" | "small2";

type Place = {
  id: PlaceId;
  name: string;
  description?: string;
};

const PLACES: Place[] = [
  { id: "worship", name: "경배실", description: "예배/모임 공간" },
  { id: "small1", name: "소회의실 1", description: "소규모 모임 공간" },
  { id: "small2", name: "소회의실 2", description: "소규모 모임 공간" },
];

export default function Page() {
  return <div style={{ padding: 24, color: "red", fontWeight: 800 }}>ONLY THIS TEXT</div>;
}
