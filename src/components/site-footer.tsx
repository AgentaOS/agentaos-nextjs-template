export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>Acme. Built from the AgentaOS Next.js template.</p>
        <p>
          Payments, tax and invoices by{" "}
          <a href="https://agentaos.ai" className="text-foreground underline-offset-4 hover:underline">
            AgentaOS
          </a>
          , the merchant of record.
        </p>
      </div>
    </footer>
  );
}
