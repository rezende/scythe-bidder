/** @jsx jsx */

import React from "react";
import { jsx } from "@emotion/core";
import { List } from "antd";
import { Ctx } from "boardgame.io";
import { Player } from "./types";

interface Props {
  ctx: Ctx;
  players: Array<Player>;
  playerID: string | null;
  isActive: boolean;
}

const TurnOrder = (props: Props) => {
  React.useEffect(() => {
    if (props.isActive) {
      const turnNotif = new Notification("Scythe Bidder", {
        body: "It's your turn!",
      });

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          turnNotif.close();
        }
      });

      turnNotif.addEventListener("click", () => {
        window.focus();
      });
    }
  }, [props.isActive]);

  return (
    <List
      header={
        <div css={{ padding: "0 24px", fontWeight: 500 }}>
          {props.ctx.gameover
            ? "Auction ended"
            : props.isActive
            ? "It's your turn!"
            : `Current player: ${
                props.players[parseInt(props.ctx.currentPlayer)].name
              }`}
        </div>
      }
      dataSource={props.ctx.playOrder}
      renderItem={(playerId, idx) => (
        <List.Item
          css={{
            padding: "12px 24px",
            fontWeight:
              !props.ctx.gameover && props.ctx.currentPlayer === playerId
                ? 500
                : 400,
            background:
              !props.ctx.gameover && props.ctx.currentPlayer === playerId
                ? "#e6f7ff"
                : "#fff",
          }}
        >
          {idx + 1}. {props.players[parseInt(playerId)].name}
        </List.Item>
      )}
      css={{ background: "#fff" }}
    ></List>
  );
};

export default TurnOrder;
