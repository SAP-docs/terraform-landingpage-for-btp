import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Terraform on SAP BTP - Landing Page',
  tagline: 'Central Landing page for all things Terraform on the SAP Business Technology Platform (BTP).',
  favicon: 'img/favicon.svg',

  // Set the production url of your site here
  //url: 'https://github.com/',
  url: 'https://sap-docs.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  //baseUrl: '/sap/btp-diagram-guideline',
  baseUrl: '/terraform-landingpage-for-btp/',
  githubHost: 'github.com',
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sap-docs', // Usually your GitHub org/user name.
  projectName: 'terraform-landingpage-for-btp', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: true,
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'throw',

  plugins: [
    './src/plugins/init-ui5-theme',
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        indexDocs: true,
        indexPages: true,
        indexBlog: false,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        removeDefaultStopWordFilter: true,
        removeDefaultStemmer: true,
      }
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig:
    {
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
        disableSwitch: false
      },
      metadata: [
        {
          name: 'keywords',
          content: 'sap, btp, terraform, automation, iac, opentofu',
        },
      ],
      image: 'img/thumbnail.png',
      navbar: {
        title: 'Terraform on SAP BTP',
        logo: {
          alt: 'SAP Logo',
          src: 'img/logo.svg',
        },
        hideOnScroll: false,
        items: [

          {
            type: 'docSidebar',
            sidebarId: 'btp_landingpage',
            position: 'right',

            label: 'Landing page',
            className: 'navbar__link--demo__res',
          },

          {
            position: 'right',
            title: 'Visit GitHub Repository',
            className: 'navbar__link--demo__repo',
            href: 'https://github.com/SAP-docs/terraform-landingpage-for-btp',

          },

        ],

      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Legal',
            items: [
              {
                label: 'Privacy',
                href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
              },
              {
                label: 'Terms of Use',
                href: 'https://www.sap.com/about/legal/terms-of-use.html',
              },
              {
                label: 'Legal Statement',
                href: 'https://www.sap.com/corporate/en/legal/impressum.html'
              }
            ],
          },
          {
            title: 'GitHub',
            items: [

              {
                label: 'GitHub Repository',
                href: 'https://github.com/SAP-docs/terraform-landingpage-for-btp',
              },
              {
                label: 'GitHub Issues',
                href: 'https://github.com/SAP-docs/terraform-landingpage-for-btp/issues',
              }
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()}  SAP SE or SAP affiliate company. All rights reserved.`,

      },

      zoom: {
        selector: '.markdown :not(em) > img',
        config: {
          background: {
            dark: '#171717',
            light: '#ffffff'
          }
        }
      },
    } satisfies Preset.ThemeConfig,
};

module.exports = config;
