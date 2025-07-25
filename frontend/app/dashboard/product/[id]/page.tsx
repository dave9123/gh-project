export default function DashboardDefaultProductPage({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { teamId: string };
}>) {
  return (
    <div>
      <h1>Product Details</h1>
      {children}
    </div>
  );
}
