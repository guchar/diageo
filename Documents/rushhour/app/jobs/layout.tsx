import ProtectedLayout from "@/components/layouts/ProtectedLayout";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
