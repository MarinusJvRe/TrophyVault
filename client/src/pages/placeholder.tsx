import Layout from "@/components/Layout";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Placeholder({ title = "Coming Soon" }: { title?: string }) {
  return (
    <Layout>
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Construction className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{title}</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          This feature is currently under development. Check back soon for updates to the TrophyVault system.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-border/50">Return Dashboard</Button>
        </Link>
      </div>
    </Layout>
  );
}
