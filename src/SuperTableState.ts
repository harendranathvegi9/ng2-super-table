import { Injectable } from '@angular/core';
import { BehaviorSubject }    from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ISuperTableColumn } from './ISuperTableColumn';

export type SORT_ORDER = 'ASC' | 'DESC';
const sortCycle : SORT_ORDER[] = ['ASC', 'DESC', null];
const getNextSortOrder : Function = function(currentSortOrder : SORT_ORDER) : SORT_ORDER {
  let nextIndex : number = (sortCycle.indexOf(currentSortOrder) + 1) % sortCycle.length;
  return sortCycle[nextIndex];
}

export interface ColumnState {
  id : string;
  filterValue : any;
  sortOrder : SORT_ORDER;
  isHidden : boolean;
  width : number;
  def : ISuperTableColumn;
  hasSort : boolean;
  hasFilter : boolean;
}

@Injectable()
export class SuperTableState {

  // source of observable
  private stateChangedSource : BehaviorSubject<SuperTableState> = new BehaviorSubject<SuperTableState>(this);

  // publicly exposed properties
  hasAnyFilters : boolean = false;
  columns : ColumnState[];
  sortStack : ColumnState[] = [];
  stateChanged$ : Observable<SuperTableState> = this.stateChangedSource.asObservable();

  public setColumns ( columns : Array<ISuperTableColumn> ) : void {
    this.columns = columns.map(c => {
      if (!!c.filter) {
        this.hasAnyFilters = true;
      }
      return {
        id: c.id,
        filterValue: null,
        sortOrder: null,
        isHidden: false,
        width: c.width || null,
        def: c,
        hasSort: !! c.sort,
        hasFilter: !!c.filter
      };
    });
  }

  public toggleSort ( colState : ColumnState, doNotClear : boolean ) : void {

    // Set next sort order
    colState.sortOrder = getNextSortOrder(colState.sortOrder);

    // Check if we are clearing the rest of the sort stack or not
    if (doNotClear) {
      let curIndex : number = this.sortStack.indexOf(colState);
      if (curIndex === -1) {
        this.sortStack.push(colState);
      } else if (!colState.sortOrder) {
        this.sortStack.splice(curIndex, 1);
      }
    } else {
      this.sortStack = colState.sortOrder ? [colState] : [];
      this.columns.forEach((column) => {
        if (column !== colState) {
          column.sortOrder = null;
        }
      });
    }

    // Notify observable of state change
    this.stateChangedSource.next(this);
  }

  public setColumnTextFilter (colState : ColumnState, searchTerm : string ) : void {
    colState.filterValue = searchTerm.trim();
    this.stateChangedSource.next(this);
  }

}
