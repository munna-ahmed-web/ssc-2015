import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "SSC-2015 Foundation — Together We Give Back",
  description:
    "A community foundation by the SSC 2015 batch of Kaya Islamia Secondary School. Join us in making a difference through weekly and monthly contributions.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
