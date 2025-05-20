import clsx from 'clsx';
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [

  {
    title: 'Terraform for SAP BTP',
    image: "/img/patterns.png",
    description: (
      <>
        This is the central landing page for Terraform on SAP BTP
      </>
    ),
  }
];
function Feature({ title, image, description }: FeatureItem) {
  return (

    <div className={clsx("col col--4")}>

      <div className="text--center">
        <img
          className={styles.featureImg}
          alt={title}
          src={useBaseUrl(image)}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}


export default function HomepageFeatures(): JSX.Element {
  return (

    <section className={styles.features}>

      <div className="container">
        <div className="section">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </div>
    </section>

  );
}
