import { motion } from "framer-motion";

/**
 * MaskedReveal — Wraps each line in an overflow-hidden mask and animates the
 * inner element from y: 100% to 0% with a stagger. Award-worthy on-load moment.
 *
 * Usage:
 *   <MaskedReveal lines={["First line", "Second line"]} className="..." />
 */
export function MaskedReveal({
  lines = [],
  as: Tag = "h1",
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.12,
  duration = 0.9,
}) {
  return (
    <Tag className={className}>
      {lines.map((text, i) => (
        <span key={i} className="mask-line">
          <motion.span
            className={`inline-block ${lineClassName}`}
            initial={{ y: "115%" }}
            animate={{ y: "0%" }}
            transition={{
              duration,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + i * stagger,
            }}
          >
            {text}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Scroll-triggered fade + slight rise. */
export function Rise({ children, className = "", delay = 0, y = 40 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
