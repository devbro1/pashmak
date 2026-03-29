import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
  imgUrl?: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Easy to Use",
    imgUrl: "img/pashmak_calm.png",
    description: (
      <>
        Pashmak is designed from the ground up to be an effective and simple
        framework for projects of all sizes, providing a great developer
        experience with minimal setup and configuration.
      </>
    ),
  },
  {
    title: "TypeScript and ESM at Core",
    imgUrl: "img/pashmak_w_shirt.png",
    description: (
      <>
        Pashmak was created with heavy focus on TypeScript and ESM, making it
        easy to write type-safe code and leverage modern JavaScript features.
      </>
    ),
  },
  {
    title: "Simplified dependencies",
    imgUrl: "img/pashmak_w_laptop.png",
    description: (
      <>
        Pashmak aims to provide a minimal set of dependencies, allowing you to
        build your application without unnecessary bloat. It uses only essential
        neko libraries ensuring a efficient framework.
      </>
    ),
  },
];

function Feature({ title, imgUrl, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img src={imgUrl} className={styles.featureImage} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
