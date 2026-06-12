import { CTASection } from "@/components/home/CTASection";
import { Hero } from "@/components/home/Hero";
import { ProductsShowcase } from "@/components/home/ProductsShowcase";
import { SegmentsShowcase } from "@/components/home/SegmentsShowcase";
import { WhyUs } from "@/components/home/WhyUs";

export default function HomePage() {
  return (<><Hero /><ProductsShowcase /><WhyUs /><SegmentsShowcase /><CTASection /></>);
}
