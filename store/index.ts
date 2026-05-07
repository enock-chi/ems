import { configureStore } from "@reduxjs/toolkit";
import postingsReducer from "./postingsSlice";
import applicationsReducer from "./applicationsSlice";
import applyReducer from "./applySlice";
import z83Reducer from "./z83Slice";

export const store = configureStore({
  reducer: {
    postings: postingsReducer,
    applications: applicationsReducer,
    apply: applyReducer,
    z83: z83Reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
