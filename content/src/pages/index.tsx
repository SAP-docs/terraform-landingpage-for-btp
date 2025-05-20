import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import HeroSection from '../sections/HeroSection'
import IntroSection from '../sections/Intro'
import WhatsSection from '../sections/Whats'

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="header_text">
          {siteConfig.title}
        </Heading>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Landing page for Terraform on SAP BTP <head />">
      <main>
        <HeroSection />
        <WhatsSection />
        <IntroSection />
      </main>
    </Layout>
  );
}
