import React from 'react';
import { motion } from 'framer-motion';

export interface OfficialNepalFlagProps {
  className?: string;
  animateEmblems?: boolean;
}

const MOON_RAY_ANGLES = [
  11.25,
  33.75,
  56.25,
  78.75,
  101.25,
  123.75,
  146.25,
  168.75,
  -11.25,
  -33.75,
  -56.25,
  -78.75,
  -101.25,
  -123.75,
  -146.25,
  -168.75,
];

const SUN_RAY_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * Componente SVG com a construção geométrica constitucional oficial da Bandeira do Nepal
 * (Artigo 5, Anexo 1 da Constituição do Nepal).
 */
export const OfficialNepalFlag: React.FC<OfficialNepalFlagProps> = ({
  className = 'w-full h-full',
  animateEmblems = true,
}) => {
  return (
    <svg
      viewBox="-17.582 -4.664 71.571 87.246"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Borda Azul Marinho Oficial (#003893) */}
      <path
        d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
        fill="none"
        stroke="#003893"
        strokeWidth="5.165"
        strokeMiterlimit="10"
      />
      {/* Campo Vermelho Carmesim Oficial (#DC143C) */}
      <path
        d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
        fill="#DC143C"
      />

      {/* Emblema Superior: Lua Crescente Real + Sol Nascente */}
      <g fill="#ffffff">
        <path d="M -11.9502769431,23.4834957055 A 12.8400974233,12.8400974233 0 0,0 11.9502769431,23.4834957055 A 11.9502769431 11.9502769431 0 0,1 -11.9502769431,23.4834957055" />
        <g transform="translate(0 29.045) scale(5.56106)">
          <motion.g
            animate={animateEmblems ? { scale: [1, 1.04, 1] } : undefined}
            transition={
              animateEmblems
                ? { duration: 4.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
                : undefined
            }
          >
            <circle r="1" />
            {MOON_RAY_ANGLES.map((angle) => (
              <path
                key={angle}
                d="M 0.195090322016,-0.980785280403 L 0,-1.388784109750 L -0.195090322016,-0.980785280403"
                transform={`rotate(${angle})`}
              />
            ))}
          </motion.g>
        </g>

        {/* Emblema Inferior: Sol Oficial de 12 Pontas */}
        <g transform="matrix(8.1434 0 0 8.1434 0 58.787)">
          <motion.g
            animate={
              animateEmblems
                ? { rotate: [-4, 4], scale: [1, 1.03, 1] }
                : undefined
            }
            transition={
              animateEmblems
                ? { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
                : undefined
            }
          >
            <circle r="1" />
            {SUN_RAY_ANGLES.map((angle) => (
              <path
                key={angle}
                d="M 0.258819045103,0.965925826289 L 0,1.576749285537 L -0.258819045103,0.965925826289"
                transform={`rotate(${angle})`}
              />
            ))}
          </motion.g>
        </g>
      </g>
    </svg>
  );
};

export default OfficialNepalFlag;
