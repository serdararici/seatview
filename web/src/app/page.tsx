import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>seatview</h1>
      <p className={styles.lead}>See the view from your seat before you buy the ticket.</p>
      <Link className={styles.link} href="/venue/harbiye-acikhava">
        Open Harbiye Açıkhava Tiyatrosu
      </Link>
    </main>
  );
}
