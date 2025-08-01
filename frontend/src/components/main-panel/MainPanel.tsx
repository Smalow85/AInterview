import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useCallback, useEffect, useRef } from "react";
import "./MainPanel.scss";
import { useCardStore } from "../../lib/store-card";
import ResponseCards from "./Cards";

const MainPanel = () => {
    const { client } = useLiveAPIContext();
    const cardsRef = useRef<HTMLDivElement>(null);
    const { addCard, updateCardInStore } = useCardStore();

    const handleCardClick = useCallback((id: string) => {
      updateCardInStore(id);
    }, [updateCardInStore]);

    useEffect(() => {
      client.on("cardAdded", addCard);
      return () => {
        client.off("cardAdded", addCard);
      };
    }, [client, addCard]);

    return (
        <div className="main-panel" ref={cardsRef}>
          <ResponseCards onCardClick={handleCardClick} />
      </div>
    );
};

export default MainPanel;
