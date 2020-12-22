import React from 'react';
import styles from '../assets/style/page/Main.module.scss';

const MainPage = () => (
  <div className={styles.app}>
    <h1 className={styles.title}>
      Mighty
    </h1>
    <div className={styles['button-cont']}>
      <div>
        <button type="button" className={styles.button}>혼자 하기</button>
      </div>
      <div>
        <button type="button" className={styles.button}>같이 하기</button>
      </div>
    </div>
  </div>
);

export default MainPage;
