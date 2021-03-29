import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({
  postsPagination: { next_page, results },
}: HomeProps): JSX.Element {
  const [posts, postsSet] = useState(results);
  const [nextPage, nextPageSet] = useState(next_page);

  async function handlePagination(): Promise<any> {
    await fetch(nextPage)
      .then(response => response.json())
      .then(response => {
        postsSet([...posts, ...response.results]);
        nextPageSet(response.next_page);
      });
  }
  return (
    <>
      <main className={styles.container}>
        {posts.map(post => (
          <a key={post.uid}>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}.</p>
            <div>
              <FiCalendar color="#BBBBBB" />
              <time>{post.first_publication_date}</time>

              <FiUser color="#BBBBBB" />
              <span>{post.data.author}</span>
            </div>
          </a>
        ))}
        {nextPage && (
          <button
            className={styles.morePosts}
            type="button"
            onClick={handlePagination}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.author', 'posts.subtitle'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(
        post.last_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  // console.log(postsResponse);

  return {
    props: {
      postsPagination: { results, next_page: postsResponse.next_page },
    },
  };
};
