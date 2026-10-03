import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token, email } = await searchParams;
  return <VerifyEmailPanel token={token} initialEmail={email} />;
}
