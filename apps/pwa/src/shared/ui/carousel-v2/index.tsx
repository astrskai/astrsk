import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";
import { DotButton, useDotButton } from "./carousel-dot-button";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./carousel-arrow-buttons";
import "./carousel.css";

export interface SlideData {
  title: string;
  content: React.ReactNode;
}

interface CarouselProps {
  slides: SlideData[];
  options?: EmblaOptionsType;
}

const Carousel = ({ slides, options }: CarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [AutoHeight()]);

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="embla">
      {/* Dynamic title based on selected slide */}
      <div className="flex items-center justify-between">
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        <h1 className="text-center text-base font-semibold">
          {slides[selectedIndex]?.title}
        </h1>
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </div>

      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide, index) => (
            <div className="embla__slide" key={index}>
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* Dots navigation */}
      <div className="flex items-center justify-center">
        {scrollSnaps.map((_, index) => (
          <DotButton
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={
              index === selectedIndex
                ? "embla__dot embla__dot--selected"
                : "embla__dot"
            }
          />
        ))}
      </div>
    </section>
  );
};

export default Carousel;
