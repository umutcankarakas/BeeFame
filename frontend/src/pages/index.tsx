import type { NextPage } from 'next';

import { Seo } from 'src/components/seo';

import { Layout as MarketingLayout } from 'src/layouts/marketing';
import { HomeFaqs } from 'src/sections/home/home-faqs';
import { HomeFeatures } from 'src/sections/home/home-features';
import { HomeHero } from 'src/sections/home/home-hero';
import { HomeTeam } from 'src/sections/home/home-team';

const Page: NextPage = () => {
  return (
    <>
      <Seo />
      <main>
        <HomeHero />
        <HomeFeatures />
        <HomeTeam />

        <HomeFaqs />
      </main>
    </>
  );
};

Page.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export default Page;
