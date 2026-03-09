import { redirect } from "next/navigation";

export default function Home() {
    // Immediately redirect to the inventory dashboard
    redirect("/inventory");
}
