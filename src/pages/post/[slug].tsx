/* eslint-disable no-param-reassign */
import { GetServerSideProps, GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments/index';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
}

export default function Post({
  post,

  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return (
      <>
        <Header />
        <div className={commonStyles.content}>Carregando...</div>
      </>
    );
  }
  const humanWordsPerMinute = 200;
  const titleWords = post.data.title.split(' ').length;

  const totalWords = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading
      ? content.heading.split(' ').length
      : 0;
    const bodyWords = RichText.asText(content.body).split(' ').length;

    acc += headingWords + bodyWords;
    return acc;
  }, 0);

  const timeToRead = Math.ceil((titleWords + totalWords) / humanWordsPerMinute);

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>
      <Header />

      <div className={styles.imagePost}>
        <img src={post.data.banner.url} alt="imagem" width="100%" />
      </div>
      <article className={styles.container}>
        <a>
          <strong>{post.data.title}</strong>

          <div className={styles.infoHeader}>
            <span>
              <FiCalendar color="#BBBBBB" />

              {/* {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })} */}
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>

            <span>
              <FiUser color="#BBBBBB" />
              {post.data.author}
            </span>

            <span>
              <FiUser color="#BBBBBB" />
              {timeToRead} min
            </span>
          </div>
          {post.first_publication_date !== post.last_publication_date && (
            <a className={styles.aada}>{`* editado em ${format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            )}`}</a>
          )}
        </a>
        {post.data.content.map(postData => (
          <div key={postData.heading} className={styles.postSection}>
            <h2>{postData.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(postData.body),
              }}
            />
          </div>
        ))}
        {preview && (
          <aside className={styles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
        <div className={styles.navigateTool}>
          {prevPost && (
            <Link href={`/post/${prevPost.uid}`}>
              <a className={styles.prevPost}>
                {prevPost.data.title}
                <span>Post Anterior</span>
              </a>
            </Link>
          )}
          {nextPost && (
            <Link href={`/post/${nextPost.uid}`}>
              <a className={styles.nextPost}>
                {nextPost?.data.title}
                <span>Próximo Post</span>
              </a>
            </Link>
          )}
        </div>
      </article>
      <div className={styles.Comments}>
        <Comments />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const { results } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
    }
  );

  const paths = results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};
export const getStaticProps: GetServerSideProps = async ({
  params: { slug },
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      notFound: true,
    };
  }

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    })
  ).results[0];
  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];
  console.log(JSON.stringify(nextPost, null, 2));
  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      banner: {
        url: response.data.banner.url,
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      nextPost: nextPost ?? null,
      prevPost: prevPost ?? null,
    },
  };
};
