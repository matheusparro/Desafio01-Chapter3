/* eslint-disable no-param-reassign */
import { GetServerSideProps, GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
      <Header />
      <div className={styles.imagePost}>
        <img src={post.data.banner.url} alt="imagem" width="100%" />
      </div>
      <article className={styles.container}>
        <a>
          <strong>{post.data.title}</strong>
          <div>
            <span>
              <FiCalendar color="#BBBBBB" />

              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
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
      </article>
    </>
  );
}

// export const getStaticPaths = async () => {
//   const prismic = getPrismicClient();
//   const posts = await prismic.query(TODO);

//   // TODO
// };

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
export const getStaticProps: GetServerSideProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    first_publication_date: response.first_publication_date,
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
    props: { post },
  };
};
