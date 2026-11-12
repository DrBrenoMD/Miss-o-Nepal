import React, { useState, useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import {
  SlideUp,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { OfficialNepalFlag } from './OfficialNepalFlag';

const drawTransition = (delay = 0, duration = 2.5) => ({
  duration,
  delay,
  ease: 'easeInOut' as const,
});

export const Slide01CoverContent: React.FC = () => {
  const [speakerImgError, setSpeakerImgError] = useState(false);
  const deckContext = useContext(DeckContext);

  const handleSlideTap = () => {
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-01-cover" className="bg-[#f4f2eb]">
      {/* Canvas 16:9 fixo (1920x1080 lógico escalonado de 320px até 4K/8K) */}
      <div
        onClick={handleSlideTap}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. TEXTOS CENTRALIZADOS NO TOPO (<SlideUp> com Stagger + CanvaFlowLayer)
           ===================================================================== */}
        <CanvaFlowLayer speed="slow" className="absolute top-[48px] left-0 right-0 z-30 flex flex-col items-center text-center pointer-events-none">
          <SlideUp delay={0.1} distance={30}>
            <p className="font-display text-[29px] font-normal uppercase tracking-[0.22em] text-[#1c1c1c] leading-none mb-[14px]">
              BATE-PAPO DA COMUNIDADE JOVEM
            </p>
          </SlideUp>

          <SlideUp delay={0.25} distance={40}>
            <MorphElement layoutId="hero-main-title">
              <h1 className="font-display text-[116px] font-black uppercase tracking-[-0.015em] text-[#050505] leading-[0.94]">
                MISSÃO NEPAL
              </h1>
            </MorphElement>
          </SlideUp>

          <SlideUp delay={0.4} distance={35}>
            <h2 className="font-display text-[60px] font-normal tracking-[-0.01em] text-[#2c2c2c] leading-[1.08] mt-[8px]">
              &amp; Liberdade Religiosa
            </h2>
          </SlideUp>
        </CanvaFlowLayer>

        {/* =====================================================================
            2. CENÁRIO EM LINE-ART COMPLETO (1920x1080)
               Com movimentação ambiente discreta e suave nos elementos
           ===================================================================== */}
        <CanvaFlowLayer speed="medium" delay={0.05} className="pointer-events-none absolute inset-0 w-full h-full z-10">
        <svg
          viewBox="0 0 1920 1080"
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* -----------------------------------------------------------------
              A. MONTANHAS DA ESQUERDA (Com flutuação parallax lenta)
             ----------------------------------------------------------------- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            {/* Contorno externo da montanha esquerda */}
            <motion.path
              d="M -10 705 L 145 545 L 188 578 L 368 448 L 435 492"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.05, 2.4)}
            />
            {/* Cristas e facetas internas da montanha esquerda */}
            <motion.path
              d="M 368 448 L 330 555 L 385 580 L 348 625 L 432 695"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.2, 2.2)}
            />
            <motion.path
              d="M 385 580 L 428 545 L 440 560 M 145 545 L 185 595 L 245 572 M 185 595 L 155 665 M 298 572 L 270 638 M 10 732 L 135 655"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.3, 2.2)}
            />
          </motion.g>

          {/* -----------------------------------------------------------------
              B. BUDA EM MEDITAÇÃO (Esquerda, apoiado sobre y=948, com respiração sutil)
             ----------------------------------------------------------------- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, -3.5, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            {/* Cabelo e Ushnisha */}
            <motion.path
              d="M 244 650 C 244 630, 286 630, 286 650 C 306 654, 314 678, 306 702 C 296 682, 280 682, 265 684 C 250 682, 234 682, 224 702 C 216 678, 224 654, 244 650 Z"
              fill="#08254c"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.25, 2.2)}
            />
            {/* Rosto e Orelhas alongadas */}
            <motion.path
              d="M 227 696 C 227 742, 244 764, 265 764 C 286 764, 303 742, 303 696 M 225 698 C 212 698, 212 738, 224 748 C 228 752, 232 744, 230 734 M 305 698 C 318 698, 318 738, 306 748 C 302 752, 298 744, 300 734"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.35, 2.2)}
            />
            {/* Pescoço, Ombros, Braços e Postura de Lótus */}
            <motion.path
              d="M 248 762 L 246 780 M 282 762 L 284 780 M 246 778 C 210 784, 166 794, 156 828 L 142 908 C 140 920, 152 924, 172 920 L 238 908 M 284 778 C 320 784, 358 794, 368 828 L 380 905"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.4, 2.4)}
            />
            {/* Manto Monástico (Sanghati) com dobras diagonais */}
            <motion.path
              d="M 312 782 C 282 828, 240 872, 206 898 M 332 788 C 305 842, 268 884, 235 908 M 346 796 C 336 848, 316 885, 295 906 M 348 815 L 344 892 M 186 825 L 182 895 L 222 892 M 212 850 L 252 850"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.5, 2.3)}
            />
            {/* Pernas cruzadas em Lótus e Mãos em Dhyana Mudra sobre a linha-base (y=948) */}
            <motion.path
              d="M 102 946 C 98 926, 145 914, 225 920 C 285 924, 345 936, 375 948 M 142 948 C 185 932, 248 932, 315 948 M 385 922 C 345 912, 285 912, 248 922 M 228 906 C 252 898, 286 898, 312 908"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.6, 2.2)}
            />
          </motion.g>

          {/* -----------------------------------------------------------------
              C. MONTANHAS CENTRO-DIREITA (Com flutuação parallax suave)
             ----------------------------------------------------------------- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.6 }}
          >
            {/* Pico Principal Alto */}
            <motion.path
              d="M 1165 382 L 1255 308 L 1385 510 L 1445 422 L 1502 472"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.1, 2.4)}
            />
            {/* Facetas e Cristas Internas da Montanha Central */}
            <motion.path
              d="M 1255 308 L 1265 412 L 1320 462 L 1300 508 L 1382 578 M 1192 425 L 1235 388 L 1222 452 M 1195 482 L 1265 538 M 1205 572 L 1245 545 L 1318 612 M 1445 422 L 1418 482 L 1442 518 L 1365 555"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.25, 2.3)}
            />
            {/* Encosta Direita (onde o macaco superior sobe) */}
            <motion.path
              d="M 1605 488 L 1805 582"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.35, 2.0)}
            />
          </motion.g>

          {/* -----------------------------------------------------------------
              D. MACACO 1 (Subindo a encosta ao lado da torre da Estupa, com leve movimento)
             ----------------------------------------------------------------- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ x: [0, -4, 0], y: [0, -3, 0], rotate: [0, -1.2, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ transformOrigin: '1700px 490px' }}
          >
            {/* Cabeça, Orelha e Focinho do Macaco Superior */}
            <motion.path
              d="M 1648 468 C 1644 454, 1664 448, 1674 458 C 1680 456, 1682 464, 1676 468 C 1668 476, 1652 476, 1648 468 Z M 1655 460 C 1658 458, 1662 460, 1660 464"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.55, 2.0)}
            />
            {/* Corpo, Membros Apoiados na Rocha e Cauda Curvada */}
            <motion.path
              d="M 1674 458 C 1702 458, 1726 474, 1732 496 L 1722 538 L 1710 535 L 1716 502 C 1702 504, 1688 498, 1678 488 L 1642 504 L 1635 498 L 1664 476 M 1678 488 L 1655 510 L 1646 506 M 1732 496 L 1742 544 L 1730 540 M 1732 484 C 1758 492, 1775 472, 1766 454 C 1760 444, 1748 446, 1746 454"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.65, 2.2)}
            />
          </motion.g>

          {/* -----------------------------------------------------------------
              E. TEMPLO / ESTUPA DE SWAYAMBHUNATH (Direita, apoiado sobre y=948)
             ----------------------------------------------------------------- */}
          <g stroke="#08254c" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Pináculo (Gajur) e Guarda-sol Real (Chatra) no Topo */}
            <motion.path
              d="M 1554 312 L 1576 312 L 1565 288 Z M 1560 312 L 1560 324 M 1570 312 L 1570 324 M 1538 324 L 1592 324 L 1584 338 L 1546 338 Z M 1546 338 L 1528 378 L 1602 378 L 1584 338 M 1552 378 L 1565 338 L 1578 378"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.2, 2.4)}
            />
            {/* Cilindro e Suportes sob o Guarda-sol */}
            <motion.path
              d="M 1522 378 C 1545 370, 1585 370, 1608 378 L 1608 422 C 1585 414, 1545 414, 1522 422 Z M 1522 398 C 1545 390, 1585 390, 1608 398 M 1534 420 L 1545 450 M 1596 420 L 1585 450 M 1560 420 L 1560 450 M 1570 420 L 1570 450"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.3, 2.3)}
            />

            {/* Torre Escalonada de 13 Degraus (Chattravali) */}
            <motion.path
              d="M 1532 450 L 1598 450 L 1598 466 L 1532 466 Z M 1525 466 L 1605 466 L 1605 482 L 1525 482 Z M 1516 482 L 1614 482 L 1614 498 L 1516 498 Z M 1506 498 L 1624 498 L 1624 516 L 1506 516 Z M 1496 516 L 1634 516 L 1634 534 L 1496 534 Z M 1486 534 L 1644 534 L 1644 554 L 1486 554 Z M 1476 554 L 1654 554 L 1654 574 L 1476 574 Z M 1466 574 L 1664 574 L 1664 594 L 1466 594 Z"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.25, 2.5)}
            />

            {/* Cornija Superior da Harmika */}
            <motion.path
              d="M 1448 594 L 1682 594 L 1682 610 L 1448 610 Z M 1448 610 L 1682 610 L 1682 622 L 1448 622 Z"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.35, 2.2)}
            />

            {/* Bloco da Harmika (Cubo dos Olhos da Sabedoria) */}
            <motion.path
              d="M 1464 622 L 1464 684 M 1666 622 L 1666 684"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.4, 2.0)}
            />

            {/* Olhos de Buda (Wisdom Eyes), Terceiro Olho e Símbolo Nasal "Ek" */}
            <motion.path
              d="M 1486 648 C 1506 636, 1538 638, 1556 650 C 1538 660, 1506 660, 1486 648 Z M 1574 650 C 1592 638, 1624 636, 1644 648 C 1624 660, 1592 660, 1574 650 Z M 1482 638 C 1508 626, 1540 630, 1558 644 M 1572 644 C 1590 630, 1622 626, 1648 638 M 1565 628 C 1568 628, 1570 632, 1565 635 C 1560 632, 1562 628, 1565 628 Z M 1558 662 C 1562 655, 1572 658, 1568 668 C 1564 674, 1565 680, 1568 682"
              strokeWidth="3.6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.45, 2.3)}
            />
            {/* Pupilas dos Olhos de Buda (com levíssimo olhar vivo) */}
            <motion.path
              d="M 1518 644 C 1524 644, 1526 652, 1518 652 C 1512 652, 1512 644, 1518 644 Z M 1612 644 C 1618 644, 1620 652, 1612 652 C 1606 652, 1606 644, 1612 644 Z"
              fill="#08254c"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, x: [-1, 1, -1] }}
              transition={{
                pathLength: drawTransition(0.55, 1.8),
                opacity: drawTransition(0.55, 1.8),
                x: { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
              }}
            />

            {/* Grande Cúpula Hemisférica (Anda) */}
            <motion.path
              d="M 1268 808 C 1300 705, 1412 678, 1565 678 C 1718 678, 1830 705, 1862 808"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.15, 2.5)}
            />

            {/* Faixas Horizontais e Escadaria Frontal da Estupa (até a linha-base y=948) */}
            <motion.path
              d="M 1235 810 C 1450 802, 1680 802, 1895 810 M 1225 828 C 1450 820, 1680 820, 1905 828 M 1220 844 C 1450 838, 1680 838, 1910 844"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.3, 2.3)}
            />
            {/* Pilares e Degraus da Escadaria Central da Estupa */}
            <motion.path
              d="M 1478 885 L 1478 826 C 1478 812, 1506 812, 1506 826 L 1506 885 M 1624 885 L 1624 826 C 1624 812, 1652 812, 1652 826 L 1652 885 M 1445 948 L 1445 884 C 1445 868, 1476 868, 1476 884 L 1476 948 M 1654 948 L 1654 884 C 1654 868, 1685 868, 1685 884 L 1685 948 M 1506 834 L 1624 834 M 1506 850 L 1624 850 M 1506 866 L 1624 866 M 1506 882 L 1624 882 M 1476 898 L 1654 898 M 1476 914 L 1654 914 M 1476 930 L 1654 930"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.4, 2.4)}
            />
          </g>

          {/* -----------------------------------------------------------------
              F. MACACO 2 (Sentado na curva direita da cúpula, com respiração sutil)
             ----------------------------------------------------------------- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, -2.5, 0], rotate: [0, 1.2, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.4 }}
            style={{ transformOrigin: '1740px 690px' }}
          >
            <motion.path
              d="M 1696 648 C 1692 634, 1712 630, 1720 642 C 1738 648, 1762 668, 1765 696 L 1762 724 M 1702 652 C 1702 666, 1696 680, 1688 688 M 1716 664 L 1704 694 M 1738 686 C 1732 696, 1726 704, 1728 712 M 1764 706 C 1782 718, 1796 732, 1802 746"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={drawTransition(0.6, 2.2)}
            />
          </motion.g>

          {/* -----------------------------------------------------------------
              G. LINHA-BASE HORIZONTAL CONTÍNUA MAIS INFERIOR (y = 948)
             ----------------------------------------------------------------- */}
          <motion.path
            d="M 0 948 L 1920 948"
            stroke="#08254c"
            strokeWidth="4.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={drawTransition(0.05, 2.2)}
          />

          {/* -----------------------------------------------------------------
              H. PAR DE ALGEMAS PENDURADAS NA BASE (Com pêndulo suave contínuo)
             ----------------------------------------------------------------- */}
          {/* --- ALGEMA ESQUERDA (x = 240..530, saindo de y = 948) --- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: [-1.6, 1.6] }}
            transition={{ duration: 4.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ transformOrigin: '285px 948px' }}
          >
            <g transform="translate(0, 56)">
              {/* Elos da corrente saindo da linha-base */}
              <motion.path
                d="M 272 888 L 256 926 C 252 936, 280 946, 286 934 L 302 888 M 266 888 L 254 918 M 292 888 L 278 924"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.35, 2.2)}
              />
              <motion.path
                d="M 252 924 C 238 932, 232 978, 248 988 C 264 996, 278 952, 268 934 M 248 938 C 242 952, 242 972, 250 978 C 258 982, 264 960, 258 944"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.45, 2.2)}
              />
              <motion.path
                d="M 244 982 C 236 1002, 248 1042, 272 1044 C 288 1046, 290 1018, 276 994 M 254 994 C 250 1010, 256 1030, 270 1032 C 278 1032, 278 1014, 268 1000"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.55, 2.2)}
              />
              {/* Corpo da Algema Esquerda + Fechadura + Arco Duplo */}
              <motion.path
                d="M 284 1030 L 326 986 C 334 978, 348 982, 356 994 C 412 974, 488 996, 514 1054 C 524 1076, 524 1094, 518 1106 M 284 1030 C 276 1040, 282 1052, 296 1062 L 320 1084 L 320 1106 M 362 1026 C 406 1006, 466 1024, 484 1068 C 492 1086, 488 1102, 480 1110 M 362 1026 C 344 1042, 344 1082, 362 1106"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.6, 2.4)}
              />
              {/* Buraco de fechadura e pino da algema esquerda */}
              <motion.path
                d="M 332 1004 C 336 1000, 342 1004, 338 1010 C 334 1014, 330 1008, 332 1004 Z M 306 1038 C 310 1034, 318 1040, 314 1046 L 324 1056 L 318 1062 L 308 1050 C 302 1048, 302 1042, 306 1038 Z"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.75, 1.8)}
              />
            </g>
          </motion.g>

          {/* --- ALGEMA DIREITA (x = 1390..1690, saindo de y = 948) --- */}
          <motion.g
            stroke="#08254c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: [1.6, -1.6] }}
            transition={{ duration: 4.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.3 }}
            style={{ transformOrigin: '1645px 948px' }}
          >
            <g transform="translate(0, 56)">
              {/* Elos da corrente saindo da linha-base */}
              <motion.path
                d="M 1622 888 L 1638 926 C 1644 936, 1670 926, 1666 914 L 1652 888 M 1632 888 L 1646 918 M 1644 888 L 1656 912"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.35, 2.2)}
              />
              <motion.path
                d="M 1654 918 C 1674 922, 1692 964, 1678 982 C 1664 996, 1642 962, 1646 932 M 1658 932 C 1670 938, 1678 962, 1670 972 C 1662 978, 1652 956, 1654 938"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.45, 2.2)}
              />
              <motion.path
                d="M 1666 974 C 1682 992, 1676 1036, 1654 1042 C 1636 1046, 1630 1018, 1642 990 M 1660 988 C 1668 1002, 1664 1026, 1652 1030 C 1644 1032, 1640 1012, 1650 994"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.55, 2.2)}
              />
              {/* Corpo da Algema Direita + Fechadura + Arco Duplo */}
              <motion.path
                d="M 1640 1026 L 1596 978 C 1588 970, 1574 974, 1564 988 C 1506 968, 1428 992, 1402 1052 C 1392 1074, 1392 1094, 1398 1106 M 1640 1026 C 1648 1036, 1642 1048, 1628 1058 L 1602 1082 L 1602 1106 M 1558 1020 C 1512 1000, 1450 1020, 1432 1066 C 1424 1086, 1428 1102, 1436 1110 M 1558 1020 C 1576 1038, 1576 1080, 1558 1106"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.6, 2.4)}
              />
              {/* Buraco de fechadura e pino da algema direita */}
              <motion.path
                d="M 1588 998 C 1584 994, 1578 998, 1582 1004 C 1586 1008, 1590 1002, 1588 998 Z M 1616 1032 C 1612 1028, 1604 1034, 1608 1040 L 1598 1050 L 1604 1056 L 1614 1044 C 1620 1042, 1620 1036, 1616 1032 Z"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawTransition(0.75, 1.8)}
              />
            </g>
          </motion.g>
        </svg>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. COMPOSIÇÃO CENTRAL MAIS INFERIOR: BANDEIRA DO NEPAL + PALESTRANTE
               Apoiados exatamente sobre a linha-base (y = 948, ou bottom = 132px)
               Sem a bolha de Liquid Glass, com movimentação sutil e orgânica
           ===================================================================== */}
        <CanvaFlowLayer
          speed="fast"
          delay={0.1}
          className="absolute left-0 right-0 bottom-[132px] h-[640px] z-20 flex items-end justify-center pointer-events-none"
        >
          <div className="relative w-[1080px] h-full flex items-end justify-center">
            {/* BANDEIRA DO NEPAL (Construção Constitucional Oficial, centralizada com o apresentador) */}
            <MorphElement
              layoutId="nepal-flag-element"
              className="absolute left-[145px] bottom-0 z-10 w-[530px] h-[645px]"
            >
              <motion.div
                className="w-full h-full drop-shadow-[0_14px_28px_rgba(8,37,76,0.14)]"
                animate={{ y: [0, -4, 0], rotate: [0, 0.35, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: 'bottom left' }}
              >
                <OfficialNepalFlag className="w-full h-full" animateEmblems />
              </motion.div>
            </MorphElement>

            {/* FOTO DO PALESTRANTE (Centralizada no eixo do conjunto Bandeira + Apresentador) */}
            <MorphElement
              layoutId="speaker-cutout-photo"
              className="relative z-20 w-[740px] h-[680px] translate-x-[55px] flex items-end justify-center overflow-hidden"
            >
              <motion.img
                src={
                  !speakerImgError
                    ? '/assets/aistudio/Design_sem_nome__5__631d9474.png'
                    : '/assets/palestrante.png'
                }
                alt="Palestrante Missão Nepal"
                onError={() => setSpeakerImgError(true)}
                animate={{ scale: [1, 1.008, 1] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: 'bottom center' }}
                className="w-[710px] h-[710px] max-w-none object-contain object-bottom translate-y-[4px] drop-shadow-[0_18px_36px_rgba(5,12,28,0.22)]"
              />
            </MorphElement>
          </div>
        </CanvaFlowLayer>
      </div>
    </SlideStage>
  );
};

export const Slide01Cover: React.FC = () => {
  return (
    <Slide backgroundColor="#f4f2eb" padding={0}>
      <Slide01CoverContent />
    </Slide>
  );
};

export default Slide01Cover;
