import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { StationDisplay } from "../../components/StationDisplay";

interface Props {
  stationId: string;
}

const StationPage: NextPage<Props> = ({ stationId }) => {
  return (
    <>
      <Head>
        <title>ShiftTrack — İstasyon</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <StationDisplay stationId={stationId} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const stationId = params?.stationId;
  if (!stationId || typeof stationId !== "string") {
    return { notFound: true };
  }
  return { props: { stationId } };
};

export default StationPage;
